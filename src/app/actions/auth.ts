"use server";

import { createClient } from "@/utils/supabase/server";
import { createOwnerShop } from "@/server/data/owner-signup";
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

  // 2. Create Shop + Owner Profile
  const created = await createOwnerShop({
    userId: authData.user.id,
    shopName,
    fullName,
    whatsapp,
    username: email.split("@")[0],
  });

  if (!created.ok) {
    return { error: created.error };
  }

  return { success: true, requireEmailConfirmation: !authData.session };
}
