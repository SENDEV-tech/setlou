"use server";

import { 
  createProfile, 
  deleteProfile, 
  updateProfile, 
  Role 
} from "@/server/data/supabase-store";
import { revalidatePath } from "next/cache";

export async function createProfileAction(formData: FormData) {
  try {
    const full_name = formData.get("full_name") as string;
    const username = formData.get("username") as string;
    const whatsapp_number = formData.get("whatsapp_number") as string;
    const role = formData.get("role") as Role;

    if (!full_name || !username || !whatsapp_number || !role) {
      return { success: false, error: "Veuillez remplir tous les champs." };
    }

    await createProfile({
      full_name,
      username,
      whatsapp_number,
      role,
    });

    revalidatePath("/profils");
    return { success: true };
  } catch (error: any) {
    console.error("Error creating profile:", error);
    return { success: false, error: error?.message || "Erreur lors de l'enregistrement." };
  }
}

export async function updateProfileAction(id: string, formData: FormData) {
  const full_name = formData.get("full_name") as string;
  const whatsapp_number = formData.get("whatsapp_number") as string;
  const role = formData.get("role") as Role;

  if (!id || !full_name || !whatsapp_number || !role) {
    return { success: false, error: "Veuillez remplir tous les champs." };
  }

  try {
    await updateProfile(id, {
      full_name,
      whatsapp_number,
      role,
    });

    revalidatePath("/profils");
    return { success: true };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return { success: false, error: error?.message || "Erreur lors de l'enregistrement." };
  }
}

export async function deleteProfileAction(id: string) {
  await deleteProfile(id);
  revalidatePath("/profils");
  return { success: true };
}
