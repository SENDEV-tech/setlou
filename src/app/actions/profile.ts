"use server";

import { 
  createProfile, 
  deleteProfile, 
  updateProfile, 
  Role 
} from "@/server/data/supabase-store";
import { revalidatePath } from "next/cache";

export async function createProfileAction(formData: FormData) {
  const full_name = formData.get("full_name") as string;
  const username = formData.get("username") as string;
  const whatsapp_number = formData.get("whatsapp_number") as string;
  const role = formData.get("role") as Role;

  if (!full_name || !username || !whatsapp_number || !role) {
    throw new Error("Veuillez remplir tous les champs.");
  }

  await createProfile({
    full_name,
    username,
    whatsapp_number,
    role,
  });

  revalidatePath("/profils");
  return { success: true };
}

export async function updateProfileAction(id: string, formData: FormData) {
  const full_name = formData.get("full_name") as string;
  const whatsapp_number = formData.get("whatsapp_number") as string;
  const role = formData.get("role") as Role;

  if (!id || !full_name || !whatsapp_number || !role) {
    throw new Error("Veuillez remplir tous les champs.");
  }

  await updateProfile(id, {
    full_name,
    whatsapp_number,
    role,
  });

  revalidatePath("/profils");
  return { success: true };
}

export async function deleteProfileAction(id: string) {
  await deleteProfile(id);
  revalidatePath("/profils");
  return { success: true };
}
