import { getCurrentShopId, getShop, getCurrentProfile } from "@/server/data/supabase-store";
import { Button } from "@/components/ui/button";
import { Check, LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";

export default async function AbonnementPage() {
  const profile = await getCurrentProfile();
  if (profile.role !== "owner") {
    redirect("/commandes");
  }

  const shopId = await getCurrentShopId();
  const shop = await getShop(shopId);

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header simple */}
      <header className="border-b bg-background px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl text-primary">
          <div className="h-8 w-8 rounded bg-primary text-primary-foreground flex items-center justify-center">
            S
          </div>
          Setlou
        </div>
        <form action={logoutAction}>
          <Button variant="ghost" size="sm" type="submit" className="text-muted-foreground hover:text-red-500">
            <LogOut className="h-4 w-4 mr-2" />
            Se déconnecter
          </Button>
        </form>
      </header>

      <main className="max-w-4xl mx-auto py-12 px-4 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Choisissez votre plan</h1>
          <p className="text-muted-foreground text-lg">
            Profitez de 14 jours d'essai gratuit. L'abonnement est requis pour accéder à l'application.
          </p>
        </div>

      <div className="grid md:grid-cols-2 gap-8 pt-8">
        {/* Pro Plan */}
        <div className="border bg-card rounded-2xl p-8 shadow-sm flex flex-col">
          <div className="mb-4">
            <h3 className="text-2xl font-bold">Pro</h3>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              10 000
              <span className="ml-1 text-xl font-medium text-muted-foreground">FCFA/mois</span>
            </div>
            <p className="text-muted-foreground mt-4">Pour les professionnels qui veulent déléguer et exploser leurs ventes.</p>
          </div>
          <ul className="space-y-4 mb-8 flex-1 font-medium text-left">
            <li className="flex items-start gap-3"><Check className="h-5 w-5 text-primary shrink-0" /> <span>Produits & Commandes illimités</span></li>
            <li className="flex items-start gap-3"><Check className="h-5 w-5 text-primary shrink-0" /> <span>Liens de paiement sécurisés</span></li>
            <li className="flex items-start gap-3"><Check className="h-5 w-5 text-primary shrink-0" /> <span>Jusqu'à 5 profils assistants</span></li>
            <li className="flex items-start gap-3"><Check className="h-5 w-5 text-primary shrink-0" /> <span>Statistiques avancées</span></li>
            <li className="flex items-start gap-3"><Check className="h-5 w-5 text-primary shrink-0" /> <span>Support prioritaire WhatsApp</span></li>
          </ul>
          
          <form action="/api/stripe/checkout" method="POST">
            <input type="hidden" name="plan" value="pro" />
            <Button type="submit" className="w-full" size="lg">
              Commencer l'essai gratuit
            </Button>
          </form>
        </div>

        {/* Enterprise Plan */}
        <div className="border-2 border-primary bg-card rounded-2xl p-8 shadow-md relative flex flex-col">
          <div className="absolute -top-4 left-0 right-0 flex justify-center">
            <span className="bg-primary text-primary-foreground text-sm font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
              Recommandé
            </span>
          </div>
          <div className="mb-4">
            <h3 className="text-2xl font-bold">Entreprise</h3>
            <div className="mt-4 flex items-baseline text-5xl font-extrabold">
              19 900
              <span className="ml-1 text-xl font-medium text-muted-foreground">FCFA/mois</span>
            </div>
            <p className="text-muted-foreground mt-4">Pour les grandes équipes et les très gros volumes de vente.</p>
          </div>
          <ul className="space-y-4 mb-8 flex-1 font-medium text-left">
            <li className="flex items-start gap-3"><Check className="h-5 w-5 text-primary shrink-0" /> <span>Tout le plan Pro</span></li>
            <li className="flex items-start gap-3"><Check className="h-5 w-5 text-primary shrink-0" /> <span>Assistants illimités</span></li>
            <li className="flex items-start gap-3"><Check className="h-5 w-5 text-primary shrink-0" /> <span>Marque blanche</span></li>
            <li className="flex items-start gap-3"><Check className="h-5 w-5 text-primary shrink-0" /> <span>Accompagnement dédié</span></li>
          </ul>
          
          <form action="/api/stripe/checkout" method="POST">
            <input type="hidden" name="plan" value="entreprise" />
            <Button type="submit" className="w-full" size="lg">
              Commencer l'essai gratuit
            </Button>
          </form>
        </div>
      </div>
      </main>
    </div>
  );
}
