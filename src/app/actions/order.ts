"use server";

import { createOrder } from "@/server/data/supabase-store";
import { revalidatePath } from "next/cache";

export async function createOrderAction(formData: FormData) {
  const customerName = formData.get("customerName") as string;
  const customerPhone = formData.get("customerPhone") as string;
  const productId = formData.get("productId") as string;
  const quantity = parseInt(formData.get("quantity") as string, 10);
  const deliveryFee = parseInt(formData.get("deliveryFee") as string, 10) || 0;

  if (!customerPhone || !productId || !quantity) {
    throw new Error("Missing required fields");
  }

  const order = await createOrder({
    customerName,
    customerPhone,
    items: [{ productId, quantity }],
    deliveryFee,
  });

  revalidatePath("/commandes");
  revalidatePath("/tableau-de-bord");

  return { 
    success: true, 
    orderId: order.id, 
    paymentLink: `https://setlou.sn/pay/${order.token_hash}` 
  };
}
