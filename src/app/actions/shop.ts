"use server";

import { z } from "zod";
import { createShopOrder, SHOP_ORDER_MAX_ITEMS, SHOP_ORDER_MAX_QUANTITY } from "@/server/data/supabase-store";
import { notifyNewShopOrder } from "@/server/data/push";
import { revalidatePath } from "next/cache";
import { after } from "next/server";

const shopOrderSchema = z.object({
  slug: z.string().min(1),
  customerName: z.string().trim().min(2, "Indiquez votre nom.").max(80),
  customerPhone: z
    .string()
    .trim()
    .regex(/^\+?[0-9 ]{9,16}$/, "Numéro de téléphone invalide."),
  items: z
    .array(z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().min(1).max(SHOP_ORDER_MAX_QUANTITY),
    }))
    .min(1, "Votre panier est vide.")
    .max(SHOP_ORDER_MAX_ITEMS),
});

export type ShopOrderInput = z.infer<typeof shopOrderSchema>;

export async function createShopOrderAction(input: ShopOrderInput) {
  const parsed = shopOrderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message || "Commande invalide." };
  }

  try {
    const order = await createShopOrder(parsed.data);
    revalidatePath(`/boutique/${parsed.data.slug}`);
    revalidatePath("/commandes");
    revalidatePath("/produits");
    // Le push part après la réponse : le client n'attend pas l'envoi.
    after(async () => {
      try {
        await notifyNewShopOrder(order);
      } catch (error) {
        console.error("Error sending order push:", error);
      }
    });
    return { ok: true as const, data: { paymentPath: `/pay/${order.token_hash}` } };
  } catch (error) {
    console.error("Error creating shop order:", error);
    return {
      ok: false as const,
      error: error instanceof Error ? error.message : "Erreur lors de la commande. Réessayez.",
    };
  }
}
