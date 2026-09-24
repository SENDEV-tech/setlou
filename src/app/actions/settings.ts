"use server";

import { updateShopSettings } from "@/server/data/supabase-store";
import { revalidatePath } from "next/cache";

export async function updateShopSettingsAction(formData: FormData) {
  const name = formData.get("name") as string;
  const whatsapp_number = formData.get("whatsapp_number") as string;
  const brand_color = formData.get("brand_color") as string;
  const welcome_message = formData.get("welcome_message") as string;
  const thank_you_message = formData.get("thank_you_message") as string;
  
  // File parsing for logo if any
  let logo_path: string | undefined;
  const imageFile = formData.get("logo") as File | null;
  if (imageFile && imageFile.size > 0) {
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    logo_path = `data:${imageFile.type};base64,${base64}`;
  }

  await updateShopSettings({
    name,
    whatsapp_number,
    brand_color,
    welcome_message,
    thank_you_message,
    logo_path,
  });

  revalidatePath("/parametres");
  return { success: true };
}
