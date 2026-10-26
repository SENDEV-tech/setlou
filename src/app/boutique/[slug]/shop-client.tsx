"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Clock,
  MessageCircle,
  Minus,
  Package,
  Plus,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { formatXOF } from "@/lib/money";
import { createShopOrderAction } from "@/app/actions/shop";

interface PublicShop {
  name: string;
  slug: string;
  logo_path: string | null;
  brand_color: string | null;
  welcome_message: string | null;
  whatsapp_number: string | null;
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
const LOW_STOCK = 3;

export function ShopClient({ shop, products }: { shop: PublicShop; products: PublicProduct[] }) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [query, setQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const brand = shop.brand_color || "#0f172a";
  const whatsapp = shop.whatsapp_number?.replace(/[^0-9]/g, "");
  const initials = shop.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();

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

  const addToCart = (product: PublicProduct) => {
    setQuantity(product, (cart[product.id] || 0) + 1);
  };

  const visibleProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? products.filter((p) => p.name.toLowerCase().includes(q) || p.description?.toLowerCase().includes(q))
      : products;
    // Les produits disponibles d'abord, les épuisés à la fin.
    return [...list].sort((a, b) => Number(a.stock_quantity === 0) - Number(b.stock_quantity === 0));
  }, [products, query]);

  const cartLines = products.filter((p) => cart[p.id]).map((p) => ({ product: p, quantity: cart[p.id] }));
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

  const Logo = ({ size }: { size: "sm" | "lg" }) => (
    <div
      className={`${size === "lg" ? "w-24 h-24 rounded-3xl text-3xl ring-4" : "w-9 h-9 rounded-xl text-sm ring-2"} ring-white shadow-lg overflow-hidden flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: brand }}
    >
      {shop.logo_path ? <img src={shop.logo_path} alt={shop.name} className="w-full h-full object-cover" /> : initials}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f7f5] text-slate-900">
      {/* Barre du haut */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Logo size="sm" />
          <span className="font-semibold truncate flex-1">{shop.name}</span>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative h-10 w-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
            aria-label="Voir le panier"
          >
            <ShoppingBag className="h-5 w-5" />
            {itemCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full text-[11px] font-bold text-white flex items-center justify-center animate-in zoom-in"
                style={{ backgroundColor: brand }}
              >
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Bannière */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(135deg, ${brand} 0%, ${brand}cc 55%, ${brand}88 100%)` }}
        />
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/10" />
        <div className="relative max-w-5xl mx-auto px-4 pt-10 pb-14 text-center text-white flex flex-col items-center">
          <Logo size="lg" />
          <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">{shop.name}</h1>
          <p className="mt-2 text-white/90 max-w-md text-sm sm:text-base">
            {shop.welcome_message || "Bienvenue ! Choisissez vos articles, commandez en 1 minute et payez en toute sécurité."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-medium">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1.5">
              <Smartphone className="h-3.5 w-3.5" /> Wave & Orange Money
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1.5">
              <Clock className="h-3.5 w-3.5" /> Commande en 1 minute
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur px-3 py-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Paiement sécurisé
            </span>
          </div>
        </div>
      </section>

      <main className="relative max-w-5xl mx-auto px-4 pt-8 sm:pt-10 pb-36">
        {/* Recherche */}
        {products.length > 3 && (
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un article..."
              className="h-12 pl-11 rounded-2xl bg-white border-slate-200 shadow-sm text-base"
            />
          </div>
        )}

        {products.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-sm p-12 text-center text-slate-500">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p className="font-medium">La boutique prépare ses articles.</p>
            <p className="text-sm">Revenez très bientôt !</p>
          </div>
        ) : visibleProducts.length === 0 ? (
          <p className="text-center text-slate-500 py-12">Aucun article ne correspond à « {query} ».</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {visibleProducts.map((product) => {
              const soldOut = product.stock_quantity === 0;
              const low = !soldOut && product.stock_quantity !== null && product.stock_quantity <= LOW_STOCK;
              const quantity = cart[product.id] || 0;
              return (
                <article
                  key={product.id}
                  className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col"
                >
                  <div className="relative aspect-[4/5] bg-slate-100 overflow-hidden">
                    {product.image_path ? (
                      <img
                        src={product.image_path}
                        alt={product.name}
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${soldOut ? "grayscale opacity-60" : ""}`}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-slate-300" />
                      </div>
                    )}
                    {soldOut && (
                      <span className="absolute top-3 left-3 rounded-full bg-slate-900/85 text-white text-[11px] font-semibold px-2.5 py-1">
                        Épuisé
                      </span>
                    )}
                    {low && (
                      <span className="absolute top-3 left-3 rounded-full bg-orange-500 text-white text-[11px] font-semibold px-2.5 py-1 shadow">
                        Plus que {product.stock_quantity} !
                      </span>
                    )}
                    {!soldOut && quantity === 0 && (
                      <button
                        type="button"
                        onClick={() => addToCart(product)}
                        className="absolute bottom-3 right-3 h-11 w-11 rounded-full text-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95"
                        style={{ backgroundColor: brand }}
                        aria-label={`Ajouter ${product.name}`}
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    )}
                    {quantity > 0 && (
                      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between rounded-full bg-white/95 backdrop-blur shadow-lg p-1">
                        <button type="button" onClick={() => setQuantity(product, quantity - 1)} className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center" aria-label="Retirer un">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="font-bold text-sm">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(product, quantity + 1)}
                          disabled={quantity >= maxFor(product)}
                          className="h-8 w-8 rounded-full text-white flex items-center justify-center disabled:opacity-40"
                          style={{ backgroundColor: brand }}
                          aria-label="Ajouter un"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="p-3 sm:p-4 flex-1 flex flex-col">
                    <h2 className="font-semibold text-sm sm:text-base leading-snug line-clamp-2">{product.name}</h2>
                    {product.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">{product.description}</p>
                    )}
                    <div className="mt-auto pt-2 text-base sm:text-lg font-extrabold" style={{ color: brand }}>
                      {formatXOF(product.price_xof)}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Contact */}
        {whatsapp && (
          <a
            href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`Bonjour ${shop.name}, j'ai une question sur vos articles.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 flex items-center gap-3 bg-white rounded-3xl shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <span className="h-11 w-11 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0">
              <MessageCircle className="h-5 w-5" />
            </span>
            <span className="flex-1">
              <span className="block font-semibold text-sm">Une question ?</span>
              <span className="block text-xs text-slate-500">Écrivez à {shop.name} sur WhatsApp</span>
            </span>
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </a>
        )}

        <p className="text-center text-xs text-slate-400 mt-10">
          Boutique propulsée par <span className="font-semibold text-slate-500">Setlou</span>
        </p>
      </main>

      {/* Barre panier */}
      {itemCount > 0 && !cartOpen && (
        <div className="fixed bottom-0 inset-x-0 z-30 p-3 sm:p-4 animate-in slide-in-from-bottom-4">
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="max-w-md mx-auto w-full flex items-center gap-3 rounded-2xl text-white shadow-2xl px-4 py-3.5 transition-transform active:scale-[0.98]"
            style={{ backgroundColor: brand }}
          >
            <span className="h-8 min-w-8 px-2 rounded-lg bg-white/20 flex items-center justify-center text-sm font-bold">{itemCount}</span>
            <span className="flex-1 text-left font-semibold">Voir mon panier</span>
            <span className="font-bold">{formatXOF(total)}</span>
          </button>
        </div>
      )}

      {/* Panier */}
      <Sheet open={cartOpen} onOpenChange={setCartOpen}>
        <SheetContent side="bottom" className="bg-white text-slate-900 rounded-t-3xl max-h-[90vh] overflow-y-auto sm:max-w-lg sm:mx-auto p-0">
          <SheetHeader className="px-5 pt-5">
            <SheetTitle className="text-xl font-bold">Mon panier</SheetTitle>
            <SheetDescription>
              {itemCount > 0 ? `${itemCount} article${itemCount > 1 ? "s" : ""}` : "Votre panier est vide."}
            </SheetDescription>
          </SheetHeader>

          {cartLines.length > 0 && (
            <form onSubmit={handleOrder} className="px-5 pb-6 space-y-5">
              <ul className="divide-y divide-slate-100">
                {cartLines.map(({ product, quantity }) => (
                  <li key={product.id} className="flex items-center gap-3 py-3">
                    <div className="h-14 w-14 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                      {product.image_path ? (
                        <img src={product.image_path} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 m-4 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{product.name}</p>
                      <p className="text-sm font-bold" style={{ color: brand }}>{formatXOF(product.price_xof * quantity)}</p>
                    </div>
                    <div className="flex items-center gap-1 rounded-full bg-slate-100 p-1">
                      <button type="button" onClick={() => setQuantity(product, quantity - 1)} className="h-7 w-7 rounded-full bg-white flex items-center justify-center shadow-sm" aria-label="Retirer un">
                        {quantity === 1 ? <Trash2 className="h-3.5 w-3.5 text-red-500" /> : <Minus className="h-3.5 w-3.5" />}
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{quantity}</span>
                      <button type="button" onClick={() => setQuantity(product, quantity + 1)} disabled={quantity >= maxFor(product)} className="h-7 w-7 rounded-full bg-white flex items-center justify-center shadow-sm disabled:opacity-40" aria-label="Ajouter un">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>

              <div className="rounded-2xl bg-slate-50 p-4 space-y-1">
                <div className="flex justify-between text-lg font-extrabold">
                  <span>Total</span>
                  <span>{formatXOF(total)}</span>
                </div>
                <p className="text-xs text-slate-500">Livraison à voir avec la boutique.</p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Vos coordonnées</p>
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Votre nom (ex : Awa Fall)" required autoComplete="name" className="h-12 rounded-xl text-base" />
                <Input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} type="tel" inputMode="tel" placeholder="Numéro WhatsApp (ex : 77 123 45 67)" required autoComplete="tel" className="h-12 rounded-xl text-base" />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 text-base font-bold rounded-2xl text-white shadow-lg hover:opacity-90"
                style={{ backgroundColor: brand }}
              >
                {loading ? "Commande en cours..." : `Commander et payer ${formatXOF(total)}`}
              </Button>
              <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Vous payez ensuite par Wave ou Orange Money
              </p>
            </form>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
