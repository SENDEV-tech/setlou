"use server";

import { updateShopSettings } from "@/server/data/supabase-store";
import { revalidatePath } from "next/cache";

export async function updateShopSettingsAction(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const whatsapp_number = formData.get("whatsapp_number") as string;
    const brand_color = formData.get("brand_color") as string;
    const welcome_message = formData.get("welcome_message") as string;
    const thank_you_message = formData.get("thank_you_message") as string;
    
    // File or base64 parsing for logo if provided
    let logo_path: string | undefined;
    const base64FromClient = formData.get("logo_base64") as string | null;
    
    if (base64FromClient && base64FromClient.startsWith("data:image/")) {
      logo_path = base64FromClient;
    } else {
      const imageFile = formData.get("logo") as File | null;
      if (imageFile && imageFile.size > 0) {
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const base64 = buffer.toString("base64");
        logo_path = `data:${imageFile.type || "image/png"};base64,${base64}`;
      }
    }

    const payload: Record<string, any> = {
      name,
      whatsapp_number,
      brand_color,
      welcome_message,
      thank_you_message,
    };

    if (logo_path !== undefined) {
      payload.logo_path = logo_path;
    }

    await updateShopSettings(payload);

    revalidatePath("/parametres");
    revalidatePath("/(app)", "layout");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur updateShopSettingsAction:", error);
    return { 
      success: false, 
      error: error?.message || "Erreur lors de la mise à jour des paramètres." 
    };
  }
}
