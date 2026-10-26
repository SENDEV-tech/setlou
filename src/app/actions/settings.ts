"use server";

import { updateShopSettings } from "@/server/data/supabase-store";
import { revalidatePath } from "next/cache";
import { SHOP_STYLES, type ShopStyle } from "@/lib/shop-style";

export async function updateShopSettingsAction(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const whatsapp_number = formData.get("whatsapp_number") as string;
    const brand_color = formData.get("brand_color") as string;
    const welcome_message = formData.get("welcome_message") as string;
    const thank_you_message = formData.get("thank_you_message") as string;
    const shop_tagline = ((formData.get("shop_tagline") as string | null) ?? "").trim().slice(0, 120);
    const styleValue = formData.get("shop_style") as string | null;
    const shop_style = SHOP_STYLES.includes(styleValue as ShopStyle) ? styleValue : "moderne";
    const coverBase64 = formData.get("cover_base64") as string | null;
    const removeCover = formData.get("remove_cover") === "1";
    
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

    // Les onglets non affichés ne sont pas dans le formulaire : on ne met à jour
    // que les champs envoyés, pour ne pas effacer le nom, le numéro, etc.
    const payload: Record<string, any> = { shop_style };
    const present = (key: string) => formData.has(key);
    if (present("name")) payload.name = name;
    if (present("whatsapp_number")) payload.whatsapp_number = whatsapp_number;
    if (present("brand_color")) payload.brand_color = brand_color;
    if (present("welcome_message")) payload.welcome_message = welcome_message;
    if (present("thank_you_message")) payload.thank_you_message = thank_you_message;
    if (present("shop_tagline")) payload.shop_tagline = shop_tagline || null;

    if (coverBase64 && coverBase64.startsWith("data:image/")) {
      payload.cover_path = coverBase64;
    } else if (removeCover) {
      payload.cover_path = null;
    }

    if (logo_path !== undefined) {
      payload.logo_path = logo_path;
    }

    await updateShopSettings(payload);

    revalidatePath("/parametres");
    revalidatePath("/(app)", "layout");
    revalidatePath("/boutique/[slug]", "page");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur updateShopSettingsAction:", error);
    return { 
      success: false, 
      error: error?.message || "Erreur lors de la mise à jour des paramètres." 
    };
  }
}
