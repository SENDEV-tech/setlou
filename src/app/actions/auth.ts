"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

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
  const { data: shopData, error: shopError } = await supabase
    .from("shops")
    .insert({
      owner_id: authData.user.id,
      name: shopName,
      slug: shopName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      whatsapp_number: whatsapp,
    })
    .select()
    .single();

  if (shopError) {
    return { error: "Erreur lors de la création de la boutique." };
  }

  // 3. Create Owner Profile
  const { error: profileError } = await supabase
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
    return { error: "Erreur lors de la création du profil." };
  }

  return { success: true, requireEmailConfirmation: !authData.session };
}
