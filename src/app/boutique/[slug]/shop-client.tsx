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
import { shopColor, toShopStyle, type ShopStyle } from "@/lib/shop-style";

interface PublicShop {
  name: string;
  slug: string;
  logo_path: string | null;
  brand_color: string | null;
  welcome_message: string | null;
  whatsapp_number: string | null;
  cover_path: string | null;
  shop_tagline: string | null;
  shop_style: string | null;
}

interface PublicProduct {
  id: string;
  name: string;
  description: string | null;
  price_xof: number;
  image_path: string | null;
  stock_quantity: number | null;
}

// Chaque style change l'ambiance : fond, typo, forme des cartes et de la bannière.
const THEMES: Record<ShopStyle, {
  page: string;
  header: string;
  title: string;
  logo: { sm: string; lg: string };
  card: string;
  productName: string;
  price: string;
  roundButton: string;
  chip: string;
  panel: string;
}> = {
  moderne: {
    page: "bg-[#f7f7f5] text-slate-900",
    header: "bg-white/85 border-b border-slate-200/70",
    title: "font-extrabold tracking-tight",
    logo: { sm: "rounded-xl", lg: "rounded-3xl" },
    card: "bg-white rounded-3xl shadow-sm hover:shadow-xl",
    productName: "font-semibold",
    price: "font-extrabold",
    roundButton: "rounded-full",
    chip: "rounded-full bg-white/20 backdrop-blur",
    panel: "bg-white rounded-3xl shadow-sm",
  },
  elegant: {
    page: "bg-[#f6f3ee] text-stone-900",
    header: "bg-[#f6f3ee]/90 border-b border-stone-300/70",
    title: "font-serif font-normal tracking-wide",
    logo: { sm: "rounded-full", lg: "rounded-full" },
    card: "bg-white rounded-sm border border-stone-200 hover:border-stone-400",
    productName: "font-serif font-normal tracking-wide",
    price: "font-medium",
    roundButton: "rounded-none",
    chip: "border border-white/30 uppercase tracking-[0.15em] text-[10px]",
    panel: "bg-white rounded-sm border border-stone-200",
  },
  colore: {
    page: "text-slate-900",
    header: "bg-white/85 border-b-2",
    title: "font-black tracking-tight",
    logo: { sm: "rounded-xl rotate-[-4deg]", lg: "rounded-[2rem] rotate-[-4deg]" },
    card: "bg-white rounded-[1.75rem] border-2 shadow-sm hover:-translate-y-1 hover:shadow-lg",
    productName: "font-bold",
    price: "font-black",
    roundButton: "rounded-2xl",
    chip: "rounded-full bg-white text-slate-900 shadow-sm",
    panel: "bg-white rounded-[1.75rem] border-2",
  },
};

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

  const brand = shopColor(shop.brand_color, shop.slug);
  const style = toShopStyle(shop.shop_style);
  const t = THEMES[style];
  // Couleur des boutons : le style Élégant reste sobre (noir), les autres prennent la couleur de la boutique.
  const accent = style === "elegant" ? "#1c1917" : brand;
  const tint = style === "colore" ? { borderColor: `${brand}33` } : undefined;
  const tagline =
    shop.shop_tagline || "Bienvenue ! Choisissez vos articles, commandez en 1 minute et payez en toute sécurité.";
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
      className={`${size === "lg" ? `w-24 h-24 text-3xl ring-4 ${t.logo.lg}` : `w-9 h-9 text-sm ring-2 ${t.logo.sm}`} ring-white shadow-lg overflow-hidden flex items-center justify-center font-bold text-white shrink-0`}
      style={{ backgroundColor: brand }}
    >
      {shop.logo_path ? <img src={shop.logo_path} alt={shop.name} className="w-full h-full object-cover" /> : initials}
    </div>
  );

  return (
    <div className={`min-h-screen ${t.page}`} style={style === "colore" ? { backgroundColor: `${brand}12` } : undefined}>
      {/* Barre du haut */}
      <header className={`sticky top-0 z-30 backdrop-blur-md ${t.header}`} style={tint}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Logo size="sm" />
          <span className={`truncate flex-1 ${style === "elegant" ? "font-serif text-lg tracking-wide" : "font-semibold"}`}>{shop.name}</span>
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
                style={{ backgroundColor: accent }}
              >
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Bannière */}
      <section className="relative overflow-hidden" style={{ backgroundColor: style === "elegant" ? "#1c1917" : brand }}>
        {shop.cover_path ? (
          <>
            <img src={shop.cover_path} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div
              className="absolute inset-0"
              style={{
                background:
                  style === "elegant"
                    ? "linear-gradient(180deg, rgba(0,0,0,.35) 0%, rgba(0,0,0,.75) 100%)"
                    : style === "colore"
                      ? `linear-gradient(180deg, ${brand}55 0%, ${brand}dd 100%)`
                      : "linear-gradient(180deg, rgba(0,0,0,.15) 0%, rgba(0,0,0,.65) 100%)",
              }}
            />
          </>
        ) : style === "moderne" ? (
          <>
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${brand} 0%, ${brand}cc 55%, ${brand}88 100%)` }}
            />
            <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-white/10" />
            <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-white/10" />
          </>
        ) : style === "elegant" ? (
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0 1px, transparent 1px 14px)" }}
          />
        ) : (
          <>
            <div
              className="absolute inset-0 opacity-25"
              style={{ backgroundImage: "radial-gradient(#fff 2px, transparent 2px)", backgroundSize: "22px 22px" }}
            />
            <div className="absolute -top-16 -left-10 w-48 h-48 rounded-[3rem] rotate-12 bg-white/15" />
            <div className="absolute -bottom-20 -right-10 w-64 h-64 rounded-full bg-black/10" />
          </>
        )}
        {style === "elegant" && <div className="absolute bottom-0 inset-x-0 h-1" style={{ backgroundColor: brand }} />}
        <div
          className={`relative max-w-5xl mx-auto px-4 text-center text-white flex flex-col items-center ${shop.cover_path ? "pt-16 pb-14 sm:pt-24" : "pt-10 pb-14"}`}
        >
          <Logo size="lg" />
          {style === "elegant" && (
            <p className="mt-5 text-[11px] uppercase tracking-[0.3em] text-white/60">Boutique</p>
          )}
          <h1 className={`${style === "elegant" ? "mt-1 text-4xl sm:text-5xl" : "mt-4 text-3xl sm:text-4xl"} ${t.title}`}>{shop.name}</h1>
          <p className={`mt-2 max-w-md text-sm sm:text-base ${style === "elegant" ? "text-white/75 italic font-serif" : "text-white/90"}`}>
            {tagline}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs font-medium">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${t.chip}`}>
              <Smartphone className="h-3.5 w-3.5" /> Wave & Orange Money
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${t.chip}`}>
              <Clock className="h-3.5 w-3.5" /> Commande en 1 minute
            </span>
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 ${t.chip}`}>
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
              className={`h-12 pl-11 bg-white border-slate-200 shadow-sm text-base ${style === "elegant" ? "rounded-sm" : "rounded-2xl"}`}
            />
          </div>
        )}

        {products.length === 0 ? (
          <div className={`${t.panel} p-12 text-center text-slate-500`} style={tint}>
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
                  className={`group transition-all duration-300 overflow-hidden flex flex-col ${t.card}`}
                  style={tint}
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
                        className={`absolute bottom-3 right-3 h-11 w-11 text-white shadow-lg flex items-center justify-center transition-transform hover:scale-110 active:scale-95 ${t.roundButton}`}
                        style={{ backgroundColor: accent }}
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
                          style={{ backgroundColor: accent }}
                          aria-label="Ajouter un"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="p-3 sm:p-4 flex-1 flex flex-col">
                    <h2 className={`text-sm sm:text-base leading-snug line-clamp-2 ${t.productName}`}>{product.name}</h2>
                    {product.description && (
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">{product.description}</p>
                    )}
                    <div className={`mt-auto pt-2 text-base sm:text-lg ${t.price}`} style={{ color: style === "elegant" ? undefined : brand }}>
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
            className={`mt-10 flex items-center gap-3 p-4 hover:shadow-md transition-shadow ${t.panel}`}
            style={tint}
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
            className={`max-w-md mx-auto w-full flex items-center gap-3 text-white shadow-2xl px-4 py-3.5 transition-transform active:scale-[0.98] ${style === "elegant" ? "rounded-sm" : "rounded-2xl"}`}
            style={{ backgroundColor: accent }}
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
                className={`w-full h-14 text-base font-bold text-white shadow-lg hover:opacity-90 ${style === "elegant" ? "rounded-sm" : "rounded-2xl"}`}
                style={{ backgroundColor: accent }}
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
