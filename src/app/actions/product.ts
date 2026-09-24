"use server";

import { 
  createProduct, 
  updateProduct, 
  deleteProduct 
} from "@/server/data/supabase-store";
import { revalidatePath } from "next/cache";

export async function createProductAction(formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseInt(formData.get("price") as string, 10);
  const image = formData.get("image") as File | null;

  if (!name || isNaN(price)) {
    throw new Error("Missing required fields or invalid price");
  }

  let image_path = undefined;
  if (image && image.size > 0) {
    const buffer = Buffer.from(await image.arrayBuffer());
    image_path = `data:${image.type};base64,${buffer.toString('base64')}`;
  }

  await createProduct({
    name,
    description,
    price,
    image_path
  });

  revalidatePath("/produits");
  revalidatePath("/commandes");

  return { success: true };
}

export async function updateProductAction(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = parseInt(formData.get("price") as string, 10);
  const image = formData.get("image") as File | null;

  if (!id || !name || isNaN(price)) {
    throw new Error("Missing required fields or invalid price");
  }

  let image_path = undefined;
  if (image && image.size > 0) {
    const buffer = Buffer.from(await image.arrayBuffer());
    image_path = `data:${image.type};base64,${buffer.toString('base64')}`;
  }

  await updateProduct(id, {
    name,
    description,
    price,
    image_path
  });

  revalidatePath("/produits");
  revalidatePath("/commandes");

  return { success: true };
}

export async function deleteProductAction(id: string) {
  await deleteProduct(id);
  revalidatePath("/produits");
  revalidatePath("/commandes");
  return { success: true };
}
