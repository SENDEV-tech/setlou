"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { FREE_PLAN } from "@/server/data/plan";
import { getAppOrigin } from "@/server/data/wave";

export async function generateUniqueShopSlug(
  adminClient: SupabaseClient,
  shopName: string
): Promise<string> {
  const base =
    shopName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "boutique";

  const { data: existing } = await adminClient
    .from("shops")
    .select("id")
    .eq("slug", base)
    .maybeSingle();

  if (!existing) {
    return base;
  }

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export async function loginAction(formData: FormData) {
  const emailOrUsername = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!emailOrUsername || !password) {
    return { error: "Email/Nom d'utilisateur et mot de passe requis." };
  }

  // Si ça ne ressemble pas à un email, on rajoute le domaine technique
  const email = emailOrUsername.includes("@") 
    ? emailOrUsername 
    : `${emailOrUsername}@assistant.setlou.shop`;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/tableau-de-bord");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  
  revalidatePath("/", "layout");
  redirect("/login");
}

const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
  fullName: z.string().trim().min(2, "Nom trop court"),
  shopName: z.string().trim().min(2, "Nom de boutique trop court"),
  whatsapp: z.string().trim().min(8, "Numéro WhatsApp invalide"),
});

export async function signupAction(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const parsed = signupSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { email, password, fullName, shopName, whatsapp } = parsed.data;

  const origin = await getAppOrigin();
  const supabase = await createClient();
  const adminClient = createAdminClient();
  const supabaseImplicit = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: "implicit",
        persistSession: false,
      },
    }
  );
  
  // 1. Create Auth User (flow implicite pour permettre la confirmation sur n'importe quel appareil/navigateur)
  const { data: authData, error: authError } = await supabaseImplicit.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/confirmed`,
      data: {
        full_name: fullName,
      },
    },
  });

  if (authError && !authError.message.toLowerCase().includes("already registered")) {
    return { error: authError.message };
  }

  // Quand "Confirm email" est actif sur Supabase, un email déjà inscrit renvoie
  // un faux objet user avec `identities: []` (son ID n'existe pas dans auth.users).
  const isExistingAccount =
    Boolean(authError) ||
    !authData.user ||
    (Array.isArray(authData.user.identities) && authData.user.identities.length === 0);

  let userId = authData.user?.id;
  let hasActiveSession = Boolean(authData?.session);

  if (authData?.session) {
    await supabase.auth.setSession({
      access_token: authData.session.access_token,
      refresh_token: authData.session.refresh_token,
    });
  }

  if (isExistingAccount) {
    const { data: listData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const existingUser = listData?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase()
    );

    if (!existingUser) {
      return {
        error: "Un compte existe déjà avec cet email. Veuillez vous connecter.",
      };
    }

    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id, shop_id")
      .eq("id", existingUser.id)
      .maybeSingle();

    const { data: existingShop } = await adminClient
      .from("shops")
      .select("id")
      .eq("owner_id", existingUser.id)
      .maybeSingle();

    if (existingProfile || existingShop) {
      return {
        error:
          "Un compte existe déjà avec cet email. Connectez-vous ou utilisez « Mot de passe oublié ».",
      };
    }

    // Compte créé précédemment sans boutique (ex: clic sur Google ou tentative interrompue) :
    // on finalise son mot de passe et on crée sa boutique.
    await adminClient.auth.admin.updateUserById(existingUser.id, {
      password,
      email_confirm: true,
      user_metadata: {
        ...existingUser.user_metadata,
        full_name: fullName,
      },
    });

    userId = existingUser.id;
    const { data: signInData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    hasActiveSession = Boolean(signInData?.session);
  }

  if (!userId) {
    return { error: "Erreur lors de la création du compte." };
  }

  // Si l'utilisateur a cliqué 2 fois sur "S'inscrire" avant de confirmer son email
  const { data: alreadyCreatedShop } = await adminClient
    .from("shops")
    .select("id")
    .eq("owner_id", userId)
    .maybeSingle();

  if (alreadyCreatedShop) {
    return { success: true, requireEmailConfirmation: !hasActiveSession };
  }

  // 2. Create Shop avec un slug garanti unique
  const uniqueSlug = await generateUniqueShopSlug(adminClient, shopName);

  const { data: shopData, error: shopError } = await adminClient
    .from("shops")
    .insert({
      owner_id: userId,
      name: shopName,
      slug: uniqueSlug,
      whatsapp_number: whatsapp,
      subscription_plan: "free",
      subscription_status: null,
      subscription_provider: null,
      paid_until: null,
      monthly_orders_limit: FREE_PLAN.monthlyOrders,
      max_assistants: FREE_PLAN.assistants,
    })
    .select()
    .single();

  if (shopError || !shopData) {
    console.error("signupAction shopError:", shopError);
    return { error: "Erreur lors de la création de la boutique." };
  }

  // 3. Create Owner Profile
  const { error: profileError } = await adminClient
    .from("profiles")
    .upsert({
      id: userId,
      shop_id: shopData.id,
      role: "owner",
      full_name: fullName,
      username: email.split("@")[0],
      whatsapp_number: whatsapp,
      is_active: true,
      must_change_password: false,
    });

  if (profileError) {
    console.error("signupAction profileError:", profileError);
    await adminClient.from("shops").delete().eq("id", shopData.id);
    return { error: "Erreur lors de la création du profil." };
  }

  return { success: true, requireEmailConfirmation: !hasActiveSession };
}

// ---------------------------------------------------------------------------
// Mot de passe oublié
// ---------------------------------------------------------------------------

export type PasswordActionResult =
  | { ok: true; data: null }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Entrez l'adresse email de votre compte."),
});

export async function forgotPasswordAction(
  formData: FormData
): Promise<PasswordActionResult> {
  const raw = String(formData.get("email") ?? "").trim();

  // Les assistants se connectent avec un nom d'utilisateur (pas de vraie boîte mail).
  if (raw && !raw.includes("@")) {
    return {
      ok: false,
      error:
        "Les comptes assistants n'ont pas d'email : demandez au propriétaire de la boutique de vous aider à retrouver l'accès.",
    };
  }

  const parsed = forgotPasswordSchema.safeParse({ email: raw });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0].message,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const origin = await getAppOrigin();
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reinitialiser-mot-de-passe")}`,
  });

  // On ne révèle pas si l'email existe : seule la limite d'envoi est signalée.
  if (error && error.status === 429) {
    return {
      ok: false,
      error: "Trop de demandes. Patientez quelques minutes avant de réessayer.",
    };
  }

  return { ok: true, data: null };
}

const resetPasswordSchema = z
  .object({
    password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Les deux mots de passe ne sont pas identiques.",
    path: ["confirm"],
  });

export async function resetPasswordAction(
  formData: FormData
): Promise<PasswordActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0].message,
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      error: "Le lien a expiré. Refaites une demande de réinitialisation.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") {
      return { ok: false, error: "Choisissez un mot de passe différent de l'ancien." };
    }
    if (error.code === "weak_password") {
      return { ok: false, error: "Mot de passe trop faible. Choisissez-en un plus long." };
    }
    return { ok: false, error: "Impossible de changer le mot de passe. Réessayez." };
  }

  revalidatePath("/", "layout");
  redirect("/tableau-de-bord");
}
