import { notFound } from "next/navigation";
import { getPublicShop } from "@/server/data/supabase-store";
import { ShopClient } from "./shop-client";

export const dynamic = "force-dynamic";

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const result = await getPublicShop(slug);
  return {
    title: result ? `${result.shop.name} | Boutique Setlou` : "Boutique introuvable | Setlou",
  };
}

export default async function ShopPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const result = await getPublicShop(slug);
  if (!result) notFound();

  return (
    <main className="min-h-screen bg-slate-50">
      <ShopClient shop={result.shop} products={result.products} />
    </main>
  );
}
