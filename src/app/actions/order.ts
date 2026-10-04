"use server";

import { createOrder, markOrderAsVerifying } from "@/server/data/supabase-store";
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
    paymentLink: `https://setlou.com/pay/${order.token_hash}`
  };
}

export async function markAsVerifyingAction(token: string) {
  try {
    await markOrderAsVerifying(token);
    return { success: true };
  } catch (error) {
    console.error("Error marking order as verifying:", error);
    return { success: false, error: "Failed to update order status." };
  }
}

export async function validateOrderPaymentAction(orderId: string) {
  try {
    const { updateOrderStatus } = await import("@/server/data/supabase-store");
    await updateOrderStatus(orderId, 'paid');
    revalidatePath("/commandes");
    revalidatePath("/tableau-de-bord");
    return { success: true };
  } catch (error) {
    console.error("Error validating payment:", error);
    return { success: false, error: "Failed to validate payment." };
  }
}
