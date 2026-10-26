"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Package, Plus, ShieldCheck, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatXOF } from "@/lib/money";
import { createShopOrderAction } from "@/app/actions/shop";

interface PublicShop {
  name: string;
  slug: string;
  logo_path: string | null;
  brand_color: string | null;
  welcome_message: string | null;
}

interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  price_xof: number;
  image_path: string | null;
  stock_quantity: number | null;
}

const MAX_QUANTITY = 20;

export function ShopClient({ shop, products }: { shop: PublicShop; products: PublicProduct[] }) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const brandColor = shop.brand_color || "#0f172a";
  const maxFor = (p: PublicProduct) => Math.min(MAX_QUANTITY, p.stock_quantity ?? MAX_QUANTITY);

  const setQuantity = (product: PublicProduct, quantity: number) => {
    setCart((prev) => {
      const next = { ...prev };
      const clamped = Math.max(0, Math.min(quantity, maxFor(product)));
      if (clamped === 0) delete next[product.id];
      else next[product.id] = clamped;
      return next;
    });
  };

  const cartLines = products
    .filter((p) => cart[p.id])
    .map((p) => ({ product: p, quantity: cart[p.id] }));
  const total = cartLines.reduce((sum, l) => sum + l.product.price_xof * l.quantity, 0);
  const itemCount = cartLines.reduce((sum, l) => sum + l.quantity, 0);

  const handleOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const result = await createShopOrderAction({
      slug: shop.slug,
      customerName,
      customerPhone,
      items: cartLines.map((l) => ({ productId: l.product.id, quantity: l.quantity })),
    });
    if (result.ok) {
      router.push(result.data.paymentPath);
    } else {
      setLoading(false);
      toast.error(result.error);
      router.refresh(); // le stock a pu changer
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-32">
      {/* En-tête */}
      <header className="px-4 pt-10 pb-8 text-white text-center" style={{ backgroundColor: brandColor }}>
        {shop.logo_path && (
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/20 p-1 mx-auto mb-3 border border-white/30 shadow-md">
            <img src={shop.logo_path} alt={shop.name} className="w-full h-full object-cover rounded-xl" />
          </div>
        )}
        <h1 className="text-2xl font-bold">{shop.name}</h1>
        {shop.welcome_message && <p className="text-white/85 text-sm mt-2 max-w-md mx-auto">{shop.welcome_message}</p>}
      </header>

      {/* Produits */}
      <section className="px-4 -mt-4">
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border p-10 text-center text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-40" />
            Aucun produit pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((product) => {
              const soldOut = product.stock_quantity === 0;
              const quantity = cart[product.id] || 0;
              return (
                <div key={product.id} className="bg-white rounded-2xl border overflow-hidden flex flex-col">
                  <div className="aspect-square bg-muted flex items-center justify-center relative">
                    {product.image_path ? (
                      <img src={product.image_path} alt={product.name} className={`w-full h-full object-cover ${soldOut ? "opacity-40" : ""}`} />
                    ) : (
                      <Package className="w-12 h-12 text-muted-foreground/30" />
                    )}
                    {soldOut && (
                      <span className="absolute top-2 left-2 rounded-full bg-red-600 text-white text-xs font-semibold px-2 py-0.5">Épuisé</span>
                    )}
                  </div>
                  <div className="p-3 flex-1 flex flex-col gap-1">
                    <h2 className="font-semibold text-sm line-clamp-2">{product.name}</h2>
                    {product.description && <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>}
                    <div className="font-bold mt-auto pt-1" style={{ color: brandColor }}>{formatXOF(product.price_xof)}</div>
                    {!soldOut && (quantity === 0 ? (
                      <Button size="sm" className="w-full mt-1" style={{ backgroundColor: brandColor }} onClick={() => setQuantity(product, 1)}>
                        Ajouter
                      </Button>
                    ) : (
                      <div className="flex items-center justify-between mt-1 rounded-lg border">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setQuantity(product, quantity - 1)} aria-label="Retirer un">
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="font-semibold text-sm">{quantity}</span>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={quantity >= maxFor(product)} onClick={() => setQuantity(product, quantity + 1)} aria-label="Ajouter un">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Panier et commande */}
      {cartLines.length > 0 && (
        <section className="px-4 mt-6">
          <form onSubmit={handleOrder} className="bg-white rounded-2xl border p-5 space-y-4">
            <h2 className="font-semibold flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Votre commande
            </h2>
            <div className="space-y-1 text-sm">
              {cartLines.map((l) => (
                <div key={l.product.id} className="flex justify-between gap-3">
                  <span className="text-slate-600">{l.quantity}x {l.product.name}</span>
                  <span className="font-medium">{formatXOF(l.product.price_xof * l.quantity)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t pt-2 font-bold">
                <span>Total</span>
                <span>{formatXOF(total)}</span>
              </div>
              <p className="text-xs text-muted-foreground">Livraison à voir avec la boutique.</p>
            </div>
            <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Votre nom (ex : Awa Fall)" required autoComplete="name" />
            <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} type="tel" placeholder="Votre numéro WhatsApp (ex : 77 123 45 67)" required autoComplete="tel" />
            <Button type="submit" className="w-full h-12 text-base font-bold rounded-xl" style={{ backgroundColor: brandColor }} disabled={loading}>
              {loading ? "Commande en cours..." : `Commander et payer ${formatXOF(total)}`}
            </Button>
            <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-4 h-4" /> Paiement par Wave ou Orange Money
            </p>
          </form>
        </section>
      )}

      {/* Barre panier mobile */}
      {itemCount > 0 && (
        <div className="fixed bottom-0 inset-x-0 p-3 bg-white/95 border-t backdrop-blur sm:hidden">
          <a href="#" onClick={(e) => { e.preventDefault(); document.querySelector("form")?.scrollIntoView({ behavior: "smooth" }); }}
            className="block w-full text-center text-white font-semibold rounded-xl py-3" style={{ backgroundColor: brandColor }}>
            Voir ma commande · {itemCount} article{itemCount > 1 ? "s" : ""} · {formatXOF(total)}
          </a>
        </div>
      )}

      <p className="text-center text-xs text-slate-400 mt-10">Boutique propulsée par Setlou</p>
    </div>
  );
}
