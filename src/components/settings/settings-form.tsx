"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateShopSettingsAction } from "@/app/actions/settings";
import { toast } from "sonner";
import { Store, Paintbrush, MessageSquare, Image as ImageIcon, Save, CreditCard, CheckCircle2 } from "lucide-react";

interface SettingsFormProps {
  shop: any;
}

export function SettingsForm({ shop }: SettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(shop.logo_path || null);
  const [brandColor, setBrandColor] = useState(shop.brand_color || "#16a34a");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      const result = await updateShopSettingsAction(formData);
      
      if (result.success) {
        toast.success("Paramètres enregistrés avec succès !");
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
          <TabsContent value="general" className="mt-0 space-y-6">
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

          <TabsContent value="customization" className="mt-0 space-y-6">
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
              </div>
            </div>
          </TabsContent>

          <TabsContent value="messaging" className="mt-0 space-y-6">
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
              
              <div className="grid md:grid-cols-2 gap-6 max-w-3xl">
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
                    10.000 FCFA
                    <span className="ml-1 text-xl font-medium text-muted-foreground">/mois</span>
                  </div>
                  <ul className="mt-6 space-y-3 flex-1">
                    <li className="flex gap-x-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                      <span>Produits & Commandes illimités</span>
                    </li>
                    <li className="flex gap-x-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                      <span>Liens de paiement sécurisés</span>
                    </li>
                    <li className="flex gap-x-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                      <span>Jusqu'à 5 profils assistants</span>
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
                    <span className="ml-1 text-xl font-medium text-muted-foreground">/mois</span>
                  </div>
                  <ul className="mt-6 space-y-3 flex-1">
                    <li className="flex gap-x-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                      <span>Tout le plan Pro</span>
                    </li>
                    <li className="flex gap-x-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                      <span>Assistants illimités</span>
                    </li>
                    <li className="flex gap-x-3 text-sm">
                      <CheckCircle2 className="h-5 w-5 flex-none text-primary" />
                      <span>Marque blanche</span>
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
