"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateShopSettingsAction } from "@/app/actions/settings";
import { toast } from "sonner";
import { Store, Paintbrush, MessageSquare, Image as ImageIcon, Save, CreditCard, CheckCircle2, Trash2 } from "lucide-react";
import { SHOP_STYLES, SHOP_STYLE_LABELS, toShopStyle, type ShopStyle } from "@/lib/shop-style";

interface SettingsFormProps {
  shop: any;
}

const compressImage = (file: File, maxDim = 512, quality = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(event.target?.result as string);
    };
    reader.onerror = (err) => reject(err);
  });
};

export function SettingsForm({ shop }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(shop.logo_path || null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [brandColor, setBrandColor] = useState(shop.brand_color || "#16a34a");
  const [coverPreview, setCoverPreview] = useState<string | null>(shop.cover_path || null);
  const [coverBase64, setCoverBase64] = useState<string | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [shopStyle, setShopStyle] = useState<ShopStyle>(toShopStyle(shop.shop_style));

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Veuillez sélectionner un fichier image valide (JPG, PNG).");
      return;
    }
    try {
      const compressed = await compressImage(file, 1400, 0.78);
      setCoverPreview(compressed);
      setCoverBase64(compressed);
      setRemoveCover(false);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la lecture de l'image.");
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        toast.error("Veuillez sélectionner un fichier image valide (JPG, PNG).");
        return;
      }
      try {
        const compressed = await compressImage(file);
        setLogoPreview(compressed);
        setLogoBase64(compressed);
      } catch (err) {
        console.error(err);
        toast.error("Erreur lors de la lecture de l'image.");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      if (logoBase64) {
        formData.set("logo_base64", logoBase64);
      }
      if (coverBase64) {
        formData.set("cover_base64", coverBase64);
      } else if (removeCover) {
        formData.set("remove_cover", "1");
      }
      formData.set("shop_style", shopStyle);
      const result = await updateShopSettingsAction(formData);
      
      if (result?.success) {
        toast.success("Paramètres enregistrés avec succès !");
      } else {
        toast.error(result?.error || "Erreur lors de l'enregistrement.");
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8" autoComplete="off">
      <Tabs defaultValue="general" className="w-full max-w-4xl">
        <TabsList className="grid w-full h-auto grid-cols-4 gap-2 mb-8 bg-transparent">
          <TabsTrigger value="general" className="flex items-center justify-center gap-2 data-[state=active]:bg-muted text-xs sm:text-sm">
            <Store className="w-4 h-4 shrink-0" />
            <span className="truncate">Général</span>
          </TabsTrigger>
          <TabsTrigger value="customization" className="flex items-center justify-center gap-2 data-[state=active]:bg-muted text-xs sm:text-sm">
            <Paintbrush className="w-4 h-4 shrink-0" />
            <span className="truncate">Personnalisation</span>
          </TabsTrigger>
          <TabsTrigger value="messaging" className="flex items-center justify-center gap-2 data-[state=active]:bg-muted text-xs sm:text-sm">
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span className="truncate">Messages</span>
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center justify-center gap-2 data-[state=active]:bg-muted text-xs sm:text-sm">
            <CreditCard className="w-4 h-4 shrink-0" />
            <span className="truncate">Abonnement</span>
          </TabsTrigger>
        </TabsList>

        <div className="bg-card border rounded-xl p-4 sm:p-6 shadow-sm">
          <TabsContent value="general" keepMounted className="mt-0 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Informations de la boutique</h3>
              
              <div className="grid gap-6 max-w-xl">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium">Nom de la boutique</label>
                  <Input id="name" name="name" defaultValue={shop.name} placeholder="Ma Super Boutique" required />
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="whatsapp_number" className="text-sm font-medium">Numéro WhatsApp de contact</label>
                  <Input id="whatsapp_number" name="whatsapp_number" defaultValue={shop.whatsapp_number} placeholder="+221 77 123 45 67" required />
                  <p className="text-xs text-muted-foreground">Les clients utiliseront ce numéro pour vous contacter.</p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="customization" keepMounted className="mt-0 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Identité Visuelle</h3>
              
              <div className="grid gap-8 max-w-xl">
                <div className="space-y-4">
                  <label className="text-sm font-medium">Logo de la boutique</label>
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted/30">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-6 h-6 sm:w-8 sm:h-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2 flex-1 w-full">
                      <Input 
                        id="logo" 
                        name="logo" 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageChange}
                        className="cursor-pointer text-xs sm:text-sm"
                      />
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
                        Format carré recommandé (JPG, PNG). Max 2MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="brand_color" className="text-sm font-medium">Couleur Principale</label>
                  <div className="flex items-center gap-3">
                    <Input 
                      id="brand_color" 
                      name="brand_color" 
                      type="color" 
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      className="w-14 h-14 p-1 cursor-pointer rounded-lg" 
                    />
                    <div className="flex-1 max-w-[200px]">
                      <Input 
                        type="text" 
                        value={brandColor} 
                        onChange={(e) => setBrandColor(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <h4 className="text-sm font-medium">Ma page boutique</h4>
                    <p className="text-xs text-muted-foreground">Ce que vos clients voient en ouvrant votre lien boutique.</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Photo de couverture</label>
                    <div className="relative aspect-[3/1] rounded-xl border-2 border-dashed overflow-hidden bg-muted/30 flex items-center justify-center">
                      {coverPreview ? (
                        <>
                          <img src={coverPreview} alt="Couverture" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => {
                              setCoverPreview(null);
                              setCoverBase64(null);
                              setRemoveCover(true);
                            }}
                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/60 text-white flex items-center justify-center"
                            aria-label="Retirer la photo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <Input
                      id="cover"
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="cursor-pointer text-xs sm:text-sm"
                    />
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      Une belle photo de vos articles ou de votre boutique, en largeur.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="shop_tagline" className="text-sm font-medium">Slogan</label>
                    <Input
                      id="shop_tagline"
                      name="shop_tagline"
                      maxLength={120}
                      defaultValue={shop.shop_tagline || ""}
                      placeholder="Ex : Les plus beaux boubous de Dakar, livrés chez vous"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">Style de la page</label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {SHOP_STYLES.map((value) => {
                        const selected = shopStyle === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setShopStyle(value)}
                            className={`rounded-xl border-2 p-2 text-left transition-colors ${selected ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/40"}`}
                            aria-pressed={selected}
                          >
                            <StylePreview style={value} color={brandColor} />
                            <span className="mt-2 block text-xs sm:text-sm font-semibold">{SHOP_STYLE_LABELS[value].label}</span>
                            <span className="block text-[10px] sm:text-xs text-muted-foreground leading-tight">{SHOP_STYLE_LABELS[value].hint}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Aperçu en direct */}
                <div className="space-y-3 pt-4 border-t">
                  <label className="text-sm font-medium">Aperçu en direct (Lien de paiement)</label>
                  <div className="border rounded-2xl overflow-hidden max-w-sm shadow-md">
                    <div 
                      className="p-5 text-white text-center relative overflow-hidden transition-colors duration-300"
                      style={{ backgroundColor: brandColor || "#0f172a" }}
                    >
                      <div className="relative z-10 flex flex-col items-center">
                        {logoPreview && (
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-white/20 p-0.5 mb-2 border border-white/30 shadow-sm backdrop-blur-xs">
                            <img src={logoPreview} alt="Logo" className="w-full h-full object-cover rounded-lg" />
                          </div>
                        )}
                        <p className="text-white/80 text-[10px] uppercase tracking-wider font-semibold">Paiement Sécurisé</p>
                        <h4 className="text-base font-bold">{shop.name || "Ma Boutique"}</h4>
                        <div className="text-2xl font-black mt-1">25.000 FCFA</div>
                        <p className="text-white/80 text-[11px] mt-0.5">Réf : CMD-8429</p>
                      </div>
                    </div>
                    <div className="p-3 bg-white dark:bg-slate-900 text-xs text-center text-muted-foreground">
                      Ce bandeau sera visible par votre client lors du paiement.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messaging" keepMounted className="mt-0 space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Messages par défaut</h3>
              
              <div className="grid gap-6 max-w-2xl">
                <div className="space-y-2">
                  <label htmlFor="welcome_message" className="text-sm font-medium">Message de bienvenue (Page de paiement)</label>
                  <Textarea 
                    id="welcome_message" 
                    name="welcome_message" 
                    defaultValue={shop.welcome_message || "Bienvenue ! Finalisez votre commande en toute sécurité ci-dessous."} 
                    className="min-h-[100px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground">Sera affiché en haut du lien de paiement envoyé au client.</p>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="thank_you_message" className="text-sm font-medium">Message de remerciement (Après paiement)</label>
                  <Textarea 
                    id="thank_you_message" 
                    name="thank_you_message" 
                    defaultValue={shop.thank_you_message || "Merci pour votre achat ! Nous préparons votre commande."} 
                    className="min-h-[100px] resize-none"
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="subscription" className="mt-0 space-y-6">
            <div className="space-y-6">
              <h3 className="text-lg font-medium">Gérer votre abonnement</h3>
              <p className="text-sm text-muted-foreground max-w-2xl">
                Modifiez votre plan d'abonnement. Le changement sera pris en compte immédiatement.
              </p>
              
              <div className="grid md:grid-cols-3 gap-6 max-w-5xl">
                {/* Plan STARTER */}
                <div className={`relative flex flex-col p-6 bg-card border rounded-2xl shadow-sm ${(!shop.stripe_price_id || shop.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || shop.subscription_plan === 'starter') && !shop.stripe_price_id?.includes('PRO') && !shop.stripe_price_id?.includes('ENTREPRISE') ? 'ring-2 ring-primary border-primary' : ''}`}>
                  {((!shop.stripe_price_id && (!shop.subscription_plan || shop.subscription_plan === 'starter')) || shop.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID) && (
                    <div className="absolute top-0 right-4 -translate-y-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Actuel
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold">Starter</h3>
                  <div className="mt-4 flex items-baseline text-3xl font-extrabold">
                    4.900 FCFA
                    <span className="ml-1 text-base font-medium text-muted-foreground">/mois</span>
                  </div>
                  <ul className="mt-6 space-y-3 flex-1">
                    <li className="flex gap-x-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                      <span><strong>100 commandes</strong> par mois</span>
                    </li>
                    <li className="flex gap-x-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                      <span><strong>1 profil assistant</strong> inclus</span>
                    </li>
                    <li className="flex gap-x-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                      <span>Liens de paiement sécurisés</span>
                    </li>
                    <li className="flex gap-x-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                      <span>Statistiques de base</span>
                    </li>
                  </ul>
                  <a
                    href="/api/stripe/checkout?plan=starter"
                    className={`mt-8 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${(!shop.stripe_price_id || shop.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || shop.subscription_plan === 'starter') ? 'bg-muted text-muted-foreground cursor-default pointer-events-none' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                  >
                    {(!shop.stripe_price_id || shop.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID || shop.subscription_plan === 'starter') ? 'Plan actuel' : 'Choisir Starter'}
                  </a>
                </div>

                {/* Plan PRO */}
                <div className={`relative flex flex-col p-6 bg-card border rounded-2xl shadow-sm ${shop.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ? 'ring-2 ring-primary border-primary' : ''}`}>
                  {shop.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID && (
                    <div className="absolute top-0 right-4 -translate-y-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Actuel
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold">Pro</h3>
                  <div className="mt-4 flex items-baseline text-3xl font-extrabold">
                    9.900 FCFA
                    <span className="ml-1 text-base font-medium text-muted-foreground">/mois</span>
                  </div>
                  <ul className="mt-6 space-y-3 flex-1">
                    <li className="flex gap-x-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                      <span><strong>Commandes illimitées</strong></span>
                    </li>
                    <li className="flex gap-x-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                      <span>Jusqu'à <strong>5 assistants</strong></span>
                    </li>
                    <li className="flex gap-x-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                      <span>Liens de paiement sécurisés</span>
                    </li>
                    <li className="flex gap-x-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                      <span>Support prioritaire WhatsApp</span>
                    </li>
                  </ul>
                  <a
                    href="/api/stripe/checkout?plan=pro"
                    className={`mt-8 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${shop.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ? 'bg-muted text-muted-foreground cursor-default pointer-events-none' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                  >
                    {shop.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID ? 'Plan actuel' : 'Choisir Pro'}
                  </a>
                </div>

                {/* Plan ENTREPRISE */}
                <div className={`relative flex flex-col p-6 bg-card border rounded-2xl shadow-sm ${shop.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_ENTREPRISE_PRICE_ID ? 'ring-2 ring-primary border-primary' : ''}`}>
                  {shop.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_ENTREPRISE_PRICE_ID && (
                    <div className="absolute top-0 right-4 -translate-y-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Actuel
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold">Entreprise</h3>
                  <div className="mt-4 flex items-baseline text-3xl font-extrabold">
                    19.900 FCFA
                    <span className="ml-1 text-base font-medium text-muted-foreground">/mois</span>
                  </div>
                  <ul className="mt-6 space-y-3 flex-1">
                    <li className="flex gap-x-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                      <span>Tout le plan Pro</span>
                    </li>
                    <li className="flex gap-x-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                      <span><strong>Assistants illimités</strong></span>
                    </li>
                    <li className="flex gap-x-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                      <span>Marque blanche</span>
                    </li>
                    <li className="flex gap-x-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                      <span>Accompagnement dédié</span>
                    </li>
                  </ul>
                  <a
                    href="/api/stripe/checkout?plan=entreprise"
                    className={`mt-8 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${shop.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_ENTREPRISE_PRICE_ID ? 'bg-muted text-muted-foreground cursor-default pointer-events-none' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
                  >
                    {shop.stripe_price_id === process.env.NEXT_PUBLIC_STRIPE_ENTREPRISE_PRICE_ID ? 'Plan actuel' : 'Passer à Entreprise'}
                  </a>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>

        <div className="mt-8 flex justify-end">
          <Button type="submit" size="lg" disabled={loading} className="shadow-lg">
            {loading ? "Enregistrement..." : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer les modifications
              </>
            )}
          </Button>
        </div>
      </Tabs>
    </form>
  );
}

function StylePreview({ style, color }: { style: ShopStyle; color: string }) {
  const banner = style === "elegant" ? "#1c1917" : color;
  const page = style === "elegant" ? "#f6f3ee" : style === "colore" ? `${color}1f` : "#f7f7f5";
  const card = style === "elegant" ? "rounded-[2px] border border-stone-300" : style === "colore" ? "rounded-md border-2" : "rounded-md shadow-sm";
  return (
    <div className="rounded-lg overflow-hidden border" style={{ backgroundColor: page }}>
      <div className="h-8 relative" style={{ backgroundColor: banner }}>
        {style === "elegant" && <div className="absolute bottom-0 inset-x-0 h-0.5" style={{ backgroundColor: color }} />}
        {style === "colore" && (
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "6px 6px" }} />
        )}
      </div>
      <div className="grid grid-cols-2 gap-1 p-1.5">
        {[0, 1].map((i) => (
          <div key={i} className={`h-7 bg-white ${card}`} style={style === "colore" ? { borderColor: `${color}55` } : undefined} />
        ))}
      </div>
    </div>
  );
}
