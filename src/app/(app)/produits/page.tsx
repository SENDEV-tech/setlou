import { getProducts, getShop, getProductSales } from "@/server/data/supabase-store";
import { ShopLinkCard } from "@/components/products/shop-link-card";
import { ProductGrid } from "@/components/products/product-grid";
import { ProductDialog } from "@/components/products/product-dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default async function ProductsPage(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const query = typeof searchParams.q === "string" ? searchParams.q.toLowerCase() : "";
  
  const [allProducts, shop, sales] = await Promise.all([
    getProducts(),
    getShop(),
    getProductSales(),
  ]);
  let products = allProducts;
  const salesByProduct = Object.fromEntries(
    sales.filter(s => s.productId).map(s => [s.productId as string, { quantity: s.quantity, revenue: s.revenue }])
  );
  
  if (query) {
    products = products.filter(p => p.name.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query));
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Catalogue de Produits</h2>
          <p className="text-muted-foreground mt-1">
            Gérez les articles que vous vendez via vos liens de paiement.
          </p>
        </div>
        <ProductDialog />
      </div>

      {shop?.slug && <ShopLinkCard slug={shop.slug} shopName={shop.name} />}

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {/* Note: In a real app we'd use a client component for search to update the URL without full reload,
              but for this mock we just show an input. Adding simple form for native behavior. */}
          <form method="GET" action="/produits">
            <Input 
              name="q"
              placeholder="Rechercher un produit..." 
              className="pl-9"
              defaultValue={query}
            />
          </form>
        </div>
      </div>
      
      <ProductGrid products={products} sales={salesByProduct} />
    </div>
  );
}
