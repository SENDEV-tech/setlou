import { getCurrentShopId, getShop, getCurrentProfile } from "@/server/data/supabase-store";
import { Button } from "@/components/ui/button";
import { Check, LogOut } from "lucide-react";
import { redirect } from "next/navigation";
import { logoutAction } from "@/app/actions/auth";
import { isWaveConfigured } from "@/server/data/wave";

function WaveForm({ plan }: { plan: string }) {
  if (!isWaveConfigured()) return null;
  return (
    <form action="/api/wave/checkout" method="POST" className="mt-2">
      <input type="hidden" name="plan" value={plan} />
      <Button type="submit" className="w-full text-white hover:opacity-90" size="lg" style={{ backgroundColor: "#1DC4FF" }}>
        Payer 1 mois avec Wave
      </Button>
    </form>
  );
}

export default async function AbonnementPage(props: { searchParams: Promise<{ wave?: string; stripe?: string }> }) {
  const { wave, stripe } = await props.searchParams;
  const profile = await getCurrentProfile();
  if (profile.role !== "owner") {
    redirect("/commandes");
  }

  const shopId = await getCurrentShopId();
  const shop = await getShop(shopId);
  // L'essai est donné à l'inscription ; seules les anciennes boutiques sans essai le démarrent par carte.
  const stripeLabel = shop.subscription_provider || shop.stripe_subscription_id ? "Payer par carte" : "Commencer l'essai gratuit";

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

      <main className="max-w-6xl mx-auto py-12 px-4 space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight">Choisissez votre plan</h1>
          <p className="text-muted-foreground text-lg">
            {shop.subscription_provider === "trial"
              ? "Votre essai gratuit de 20 jours est inclus dès l'inscription. Choisissez un plan pour continuer après."
              : "L'abonnement est requis pour accéder à l'application."}
          </p>
          {shop.subscription_provider === "trial" && shop.paid_until && (
            <p className="text-sm font-medium">
              {new Date(shop.paid_until).getTime() > Date.now() ? "Essai gratuit jusqu'au " : "Essai gratuit terminé le "}
              {new Date(shop.paid_until).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.
            </p>
          )}
          {isWaveConfigured() && <p className="text-muted-foreground text-sm">
            Avec Wave, chaque paiement ajoute 30 jours d'accès, sans prélèvement automatique. Payé pendant l'essai, le mois commence à la fin de l'essai.
          </p>}
          {shop.subscription_provider === "wave" && shop.paid_until && (
            <p className="text-sm font-medium">
              Abonnement Wave payé jusqu'au {new Date(shop.paid_until).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}.
            </p>
          )}
          {stripe === "erreur" && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 max-w-md mx-auto">
              Le paiement par carte est indisponible pour le moment. Réessayez plus tard ou contactez le support.
            </p>
          )}
          {wave === "erreur" && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 max-w-md mx-auto">
              Le paiement Wave n'a pas abouti. Vous pouvez réessayer.
            </p>
          )}
          {wave === "attente" && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl p-3 max-w-md mx-auto">
              Paiement Wave en cours de confirmation. Actualisez cette page dans une minute.
            </p>
          )}
        </div>

      <div className="grid md:grid-cols-3 gap-8 pt-8 items-stretch">
        {/* Starter Plan */}
        <div className="border bg-card rounded-2xl p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-2xl font-bold">Starter</h3>
              <div className="mt-4 flex items-baseline text-4xl font-extrabold">
                4 900
                <span className="ml-1 text-base font-medium text-muted-foreground">FCFA/mois</span>
              </div>
              <p className="text-muted-foreground text-sm mt-3">Idéal pour débuter et sécuriser vos ventes régulières.</p>
            </div>
            <ul className="space-y-3.5 mb-8 font-medium text-sm text-left">
              <li className="flex items-start gap-2.5"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span><strong>100 commandes</strong> par mois</span></li>
              <li className="flex items-start gap-2.5"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span><strong>1 profil assistant</strong> inclus</span></li>
              <li className="flex items-start gap-2.5"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span>Liens de paiement Wave & OM</span></li>
              <li className="flex items-start gap-2.5"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span>Statistiques essentielles</span></li>
              <li className="flex items-start gap-2.5"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span>Support standard</span></li>
            </ul>
          </div>
          
          <div>
            <form action="/api/stripe/checkout" method="POST">
              <input type="hidden" name="plan" value="starter" />
              <Button type="submit" variant="outline" className="w-full" size="lg">
                {stripeLabel}
              </Button>
            </form>
            <WaveForm plan="starter" />
          </div>
        </div>

        {/* Pro Plan */}
        <div className="border-2 border-primary bg-card rounded-2xl p-7 shadow-lg relative flex flex-col justify-between scale-105 z-10">
          <div className="absolute -top-3.5 left-0 right-0 flex justify-center">
            <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
              Le plus populaire
            </span>
          </div>
          <div>
            <div className="mb-4">
              <h3 className="text-2xl font-bold">Pro</h3>
              <div className="mt-4 flex items-baseline text-4xl font-extrabold">
                9 900
                <span className="ml-1 text-base font-medium text-muted-foreground">FCFA/mois</span>
              </div>
              <p className="text-muted-foreground text-sm mt-3">Pour les professionnels qui veulent déléguer et exploser leurs ventes.</p>
            </div>
            <ul className="space-y-3.5 mb-8 font-medium text-sm text-left">
              <li className="flex items-start gap-2.5"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span><strong>Commandes illimitées</strong></span></li>
              <li className="flex items-start gap-2.5"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span>Jusqu'à <strong>5 profils assistants</strong></span></li>
              <li className="flex items-start gap-2.5"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span>Liens de paiement sécurisés</span></li>
              <li className="flex items-start gap-2.5"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span>Statistiques avancées</span></li>
              <li className="flex items-start gap-2.5"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span>Support prioritaire WhatsApp</span></li>
            </ul>
          </div>
          
          <div>
            <form action="/api/stripe/checkout" method="POST">
              <input type="hidden" name="plan" value="pro" />
              <Button type="submit" className="w-full shadow-md" size="lg">
                {stripeLabel}
              </Button>
            </form>
            <WaveForm plan="pro" />
          </div>
        </div>

        {/* Enterprise Plan */}
        <div className="border bg-card rounded-2xl p-7 shadow-sm flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h3 className="text-2xl font-bold">Entreprise</h3>
              <div className="mt-4 flex items-baseline text-4xl font-extrabold">
                19 900
                <span className="ml-1 text-base font-medium text-muted-foreground">FCFA/mois</span>
              </div>
              <p className="text-muted-foreground text-sm mt-3">Pour les grandes équipes et les très gros volumes de vente.</p>
            </div>
            <ul className="space-y-3.5 mb-8 font-medium text-sm text-left">
              <li className="flex items-start gap-2.5"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span>Tout le plan Pro</span></li>
              <li className="flex items-start gap-2.5"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span><strong>Assistants illimités</strong></span></li>
              <li className="flex items-start gap-2.5"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span>Marque blanche</span></li>
              <li className="flex items-start gap-2.5"><Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> <span>Accompagnement dédié</span></li>
            </ul>
          </div>
          
          <div>
            <form action="/api/stripe/checkout" method="POST">
              <input type="hidden" name="plan" value="entreprise" />
              <Button type="submit" variant="outline" className="w-full" size="lg">
                {stripeLabel}
              </Button>
            </form>
            <WaveForm plan="entreprise" />
          </div>
        </div>
      </div>
      </main>
    </div>
  );
}
