"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { FREE_PLAN } from "@/server/data/plan";
import { getAppOrigin } from "@/server/data/wave";

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
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit faire au moins 6 caractères"),
  fullName: z.string().min(2, "Nom trop court"),
  shopName: z.string().min(2, "Nom de boutique trop court"),
  whatsapp: z.string().min(8, "Numéro WhatsApp invalide"),
});

export async function signupAction(formData: FormData) {
  const data = Object.fromEntries(formData.entries());
  const parsed = signupSchema.safeParse(data);

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { email, password, fullName, shopName, whatsapp } = parsed.data;

  const supabase = await createClient();
  
  // 1. Create Auth User
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (authError) {
    return { error: authError.message };
  }

  if (!authData.user) {
    return { error: "Erreur lors de la création du compte." };
  }

  // 2. Create Shop
  // Clé service_role : la RLS interdit ces insertions depuis le navigateur, et
  // aucune session n'existe encore si l'email doit être confirmé.
  const adminClient = createAdminClient();
  const { data: shopData, error: shopError } = await adminClient
    .from("shops")
    .insert({
      owner_id: authData.user.id,
      name: shopName,
      slug: shopName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      whatsapp_number: whatsapp,
      // Formule gratuite à vie (limites dans src/server/data/plan.ts) ;
      // abonnement Wave ou carte seulement quand la boutique grandit.
      subscription_plan: 'free',
      subscription_status: null,
      subscription_provider: null,
      paid_until: null,
      monthly_orders_limit: FREE_PLAN.monthlyOrders,
      max_assistants: FREE_PLAN.assistants,
    })
    .select()
    .single();

  if (shopError) {
    return { error: "Erreur lors de la création de la boutique." };
  }

  // 3. Create Owner Profile
  const { error: profileError } = await adminClient
    .from("profiles")
    .insert({
      id: authData.user.id,
      shop_id: shopData.id,
      role: "owner",
      full_name: fullName,
      username: email.split("@")[0],
      whatsapp_number: whatsapp,
      is_active: true,
      must_change_password: false,
    });

  if (profileError) {
    await adminClient.from("shops").delete().eq("id", shopData.id);
    return { error: "Erreur lors de la création du profil." };
  }

  return { success: true, requireEmailConfirmation: !authData.session };
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
