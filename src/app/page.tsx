import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Boxes,
  BadgeCheck,
  ChevronDown,
  Link2,
  Menu,
  MessageCircle,
  PackagePlus,
  SearchX,
  Smartphone,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const title = "Setlou — Vos ventes WhatsApp, enfin comptées";
const description =
  "Envoyez un lien de paiement pour chaque commande WhatsApp. Setlou compte vos ventes, gère votre stock et vous offre une boutique en ligne. 0 % de commission.";

export const metadata: Metadata = {
  title,
  description,
  openGraph: { type: "website", siteName: "Setlou", locale: "fr_FR", url: "/", title, description },
  twitter: { card: "summary_large_image", title, description },
};

const navLinks = [
  { href: "#comment", label: "Comment ça marche" },
  { href: "#nouveautes", label: "Nouveautés" },
  { href: "#tarifs", label: "Tarifs" },
  { href: "#faq", label: "FAQ" },
];

const problems = [
  {
    icon: SearchX,
    title: "Combien avez-vous vendu ce mois-ci ?",
    text: "Les commandes sont éparpillées dans des dizaines de discussions. Faire le total prend des heures, ou ne se fait jamais.",
  },
  {
    icon: Users,
    title: "Qui a vendu quoi ?",
    text: "Vos assistants répondent sur leurs propres numéros. Impossible de savoir combien chacun a conclu.",
  },
  {
    icon: Smartphone,
    title: "Ce client a-t-il vraiment payé ?",
    text: "Vous fouillez vos notifications Wave et Orange Money pour retrouver chaque transfert.",
  },
];

const steps = [
  {
    icon: PackagePlus,
    title: "Ajoutez vos produits",
    text: "Nom, prix, photo. Une seule fois.",
  },
  {
    icon: Link2,
    title: "Créez la commande",
    text: "Choisissez le produit et la quantité : Setlou génère un lien de paiement à votre nom.",
  },
  {
    icon: MessageCircle,
    title: "Envoyez le lien sur WhatsApp",
    text: "Le client voit le détail et le montant, paie sur votre Wave ou Orange Money, puis confirme.",
  },
  {
    icon: BadgeCheck,
    title: "Validez en un clic",
    text: "Dès que vous avez reçu l'argent, la vente est comptée dans votre chiffre d'affaires.",
  },
];

const plans = [
  {
    name: "Starter",
    price: "4.900",
    pitch: "Pour un vendeur seul qui veut enfin connaître ses chiffres.",
    features: ["100 commandes par mois", "1 profil assistant", "Liens de paiement personnalisés", "Statistiques de base"],
    href: "/signup?plan=starter",
    featured: false,
  },
  {
    name: "Pro",
    price: "9.900",
    pitch: "Pour les boutiques qui vendent avec une équipe.",
    features: ["Commandes illimitées", "Jusqu'à 5 profils assistants", "Ventes par assistant", "Support prioritaire WhatsApp"],
    href: "/signup?plan=pro",
    featured: true,
  },
  {
    name: "Entreprise",
    price: "19.900",
    pitch: "Pour les grosses équipes et les gros volumes.",
    features: ["Tout le plan Pro", "Assistants illimités", "Accompagnement à la mise en place"],
    href: "/signup?plan=entreprise",
    featured: false,
  },
];

const faqs = [
  {
    q: "L'argent passe-t-il par Setlou ?",
    a: "Non. Le client paie directement sur votre numéro Wave ou Orange Money. Setlou ne touche pas votre argent et ne prend aucune commission sur vos ventes : vous ne payez que l'abonnement.",
  },
  {
    q: "Comment je sais que le client a vraiment payé ?",
    a: "Le client confirme son transfert sur la page de paiement, la commande passe en « à vérifier ». Vous contrôlez la réception sur votre Wave ou Orange Money, puis vous validez. Seules les ventes validées comptent dans votre chiffre d'affaires.",
  },
  {
    q: "Mes assistants voient-ils mes revenus ?",
    a: "Non. Un assistant n'a accès qu'aux commandes et aux produits. Le tableau de bord, les revenus, les profils et les paramètres sont réservés au propriétaire de la boutique.",
  },
  {
    q: "Je vends seul, Setlou est-il utile ?",
    a: "Oui. Même sans assistant, vous obtenez des liens de paiement propres pour vos clients et un suivi automatique de vos ventes par semaine, mois et année.",
  },
  {
    q: "Ai-je besoin de WhatsApp Business ou d'un site web ?",
    a: "Non. Vous continuez à vendre sur votre WhatsApp habituel. Setlou vous donne simplement un lien à envoyer et un tableau de bord pour suivre vos ventes.",
  },
  {
    q: "Que se passe-t-il après l'essai de 20 jours ?",
    a: "Votre boutique est mise en pause jusqu'à ce que vous choisissiez un plan. Vos produits et vos commandes sont conservés.",
  },
];

function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 font-bold text-xl tracking-tight", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
        S
      </span>
      Setlou
    </Link>
  );
}

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Logo />

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <Link href="/login" className="text-sm font-semibold hover:text-primary">
            Se connecter
          </Link>
          <Link href="/signup" className={buttonVariants({ className: "rounded-full px-5" })}>
            Essayer gratuitement
          </Link>
        </div>

        {/* Menu mobile sans JavaScript */}
        <details className="group md:hidden">
          <summary className="list-none rounded-lg p-2 [&::-webkit-details-marker]:hidden" aria-label="Ouvrir le menu">
            <Menu className="h-6 w-6" />
          </summary>
          <div className="absolute left-0 top-16 flex w-full flex-col gap-1 border-b bg-background px-4 pb-6 pt-2 shadow-lg">
            {navLinks.map((l) => (
              <Link key={l.href} href={l.href} className="border-b py-3 text-base font-medium">
                {l.label}
              </Link>
            ))}
            <Link href="/login" className="py-3 text-base font-medium text-primary">
              Se connecter
            </Link>
            <Link href="/signup" className={buttonVariants({ size: "lg", className: "mt-2 w-full rounded-full" })}>
              Essayer gratuitement
            </Link>
          </div>
        </details>
      </div>
    </header>
  );
}

/** Aperçu illustratif : la page de paiement vue par le client et le tableau de bord vu par le vendeur. */
function HeroPreview() {
  return (
    <div className="relative mx-auto w-full max-w-md lg:max-w-none" aria-hidden="true">
      {/* Page de paiement (téléphone) */}
      <div className="relative z-10 mx-auto w-64 rounded-[2rem] border-[6px] border-foreground/90 bg-background shadow-2xl sm:w-72">
        <div className="rounded-t-[1.6rem] bg-slate-900 px-5 pb-5 pt-6 text-center text-white">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">Paiement</p>
          <p className="mt-1 text-sm font-semibold">Boutique Awa Style</p>
          <p className="mt-2 text-3xl font-black">25 000 F</p>
          <p className="mt-1 text-[10px] text-white/60">Réf : CMD-0142</p>
        </div>
        <div className="space-y-3 p-4 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">2x Robe wax</span>
            <span className="font-medium">22 000 F</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Livraison</span>
            <span className="font-medium">3 000 F</span>
          </div>
          <div className="rounded-xl border bg-muted/50 p-3">
            <p className="text-[11px] text-muted-foreground">Envoyez le montant via Wave ou Orange Money au</p>
            <p className="mt-1 font-bold tracking-wider">77 123 45 67</p>
          </div>
          <div className="rounded-xl bg-primary py-2.5 text-center text-xs font-bold text-primary-foreground">
            J&apos;ai effectué le transfert
          </div>
        </div>
      </div>

      {/* Carte tableau de bord */}
      <div className="relative z-20 -mt-8 ml-auto w-60 rounded-2xl border bg-card p-4 shadow-xl sm:w-64 lg:absolute lg:-right-4 lg:bottom-6 lg:mt-0">
        <p className="text-[11px] font-medium text-muted-foreground">Cette semaine</p>
        <p className="mt-0.5 text-2xl font-black">487 500 F</p>
        <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">32 ventes validées</p>
        <div className="mt-3 space-y-2 border-t pt-3">
          {[
            { name: "Awa", sales: 14, w: "w-full" },
            { name: "Ibou", sales: 11, w: "w-4/5" },
            { name: "Vous", sales: 7, w: "w-1/2" },
          ].map((a) => (
            <div key={a.name} className="flex items-center gap-2 text-[11px]">
              <span className="w-8 font-medium">{a.name}</span>
              <span className="h-1.5 flex-1 rounded-full bg-muted">
                <span className={cn("block h-1.5 rounded-full bg-emerald-500", a.w)} />
              </span>
              <span className="w-5 text-right tabular-nums text-muted-foreground">{a.sales}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const newFeatures = [
  {
    icon: Store,
    title: "Votre boutique en ligne",
    text: "Un lien à mettre dans votre statut ou votre bio. Vos clients choisissent leurs articles, remplissent leur panier et commandent seuls.",
  },
  {
    icon: Boxes,
    title: "Un stock toujours à jour",
    text: "Le stock baisse à chaque commande. Setlou vous prévient quand un produit arrive à la fin et l'affiche épuisé dans votre boutique.",
  },
  {
    icon: BellRing,
    title: "Les commandes en temps réel",
    text: "Une notification arrive sur votre téléphone dès qu'un client commande. Vous ne ratez plus aucune vente.",
  },
];

/** Aperçu illustratif : une notification de commande et l'état du stock. */
function FeaturesPreview() {
  const stock = [
    { name: "Robe wax", left: "12 en stock", tone: "text-emerald-600 dark:text-emerald-400" },
    { name: "Sac en cuir", left: "Plus que 2", tone: "text-orange-500" },
    { name: "Sandales tressées", left: "Épuisé", tone: "text-red-500" },
  ];
  return (
    <div className="space-y-4" aria-hidden="true">
      <div className="flex items-start gap-3 rounded-2xl border bg-card p-4 shadow-lg">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <BellRing className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">Nouvelle commande CMD-0143</span>
            <span className="text-xs text-muted-foreground">maintenant</span>
          </span>
          <span className="mt-0.5 block text-sm text-muted-foreground">Fatou N. · 2x Robe wax · 22 000 F</span>
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl border bg-card shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Stock</p>
          <p className="text-xs text-muted-foreground">Mis à jour automatiquement</p>
        </div>
        <ul className="divide-y">
          {stock.map((p) => (
            <li key={p.name} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="font-medium">{p.name}</span>
              <span className={cn("font-semibold", p.tone)}>{p.left}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 shadow-lg">
        <Link2 className="h-5 w-5 shrink-0 text-muted-foreground" />
        <span className="truncate text-sm font-medium">setlou.com/boutique/awa-style</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background text-foreground">
      <Navbar />

      <main className="flex-1">
        {/* HERO */}
        <section className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-14 md:pt-20 lg:grid-cols-[1.1fr_1fr] lg:gap-10 lg:pb-28">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border bg-muted/50 px-3 py-1 text-xs font-semibold text-muted-foreground">
              <MessageCircle className="h-3.5 w-3.5" />
              Pour les vendeurs qui vendent sur WhatsApp
            </p>
            <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Vos ventes WhatsApp, enfin comptées.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              Envoyez un lien de paiement pour chaque commande. Setlou enregistre la vente, met votre stock à jour
              et calcule votre chiffre d&apos;affaires de la semaine, du mois et de l&apos;année.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/signup" className={buttonVariants({ size: "lg", className: "h-12 rounded-full px-7 text-base" })}>
                Essayer 20 jours gratuits <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
              <Link
                href="#comment"
                className={buttonVariants({ variant: "outline", size: "lg", className: "h-12 rounded-full px-7 text-base" })}
              >
                Voir comment ça marche
              </Link>
            </div>
            <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Wave et Orange Money
              </li>
              <li className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> 0 % de commission
              </li>
              <li className="flex items-center gap-1.5">
                <BadgeCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" /> Sans site web
              </li>
            </ul>
          </div>
          <HeroPreview />
        </section>

        {/* PROBLÈME */}
        <section className="border-y bg-muted/40 py-20">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
              Vendre sur WhatsApp, c&apos;est rapide. Suivre ses ventes, beaucoup moins.
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {problems.map((p) => (
                <div key={p.title} className="rounded-2xl border bg-background p-6">
                  <p.icon className="h-6 w-6 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-bold">{p.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{p.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* COMMENT ÇA MARCHE */}
        <section id="comment" className="scroll-mt-16 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <p className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Comment ça marche</p>
            <h2 className="mt-3 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-4xl">
              Vous gardez WhatsApp. Setlou fait les comptes.
            </h2>
            <ol className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map((s, i) => (
                <li key={s.title} className="relative rounded-2xl border p-6">
                  <span className="text-sm font-bold tabular-nums text-muted-foreground">0{i + 1}</span>
                  <s.icon className="mt-4 h-7 w-7" />
                  <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                  <p className="mt-2 leading-relaxed text-muted-foreground">{s.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* NOUVEAUTÉS */}
        <section id="nouveautes" className="scroll-mt-16 bg-slate-950 py-20 text-white md:py-28">
          <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-white/50">Nouveautés</p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
                Plus qu&apos;un lien de paiement : toute votre boutique.
              </h2>
              <ul className="mt-8 space-y-6">
                {newFeatures.map((item) => (
                  <li key={item.title} className="flex gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <item.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-bold">{item.title}</h3>
                      <p className="mt-1 leading-relaxed text-white/75">{item.text}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="text-foreground">
              <FeaturesPreview />
            </div>
          </div>
        </section>

        {/* ARGENT */}
        <section className="py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <Wallet className="mx-auto h-8 w-8" />
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight sm:text-4xl">Votre argent ne passe pas par nous.</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Vos clients paient directement sur votre Wave ou votre Orange Money. Pas d&apos;intermédiaire, pas de délai
              de reversement, pas de commission sur vos ventes. Vous payez seulement l&apos;abonnement.
            </p>
          </div>
        </section>

        {/* TARIFS */}
        <section id="tarifs" className="scroll-mt-16 border-t bg-muted/40 py-20 md:py-28">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Des tarifs simples</h2>
              <p className="mt-3 text-muted-foreground">20 jours d&apos;essai gratuit sur tous les plans.</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={cn(
                    "relative flex flex-col rounded-2xl border bg-background p-7",
                    plan.featured && "border-2 border-primary shadow-xl"
                  )}
                >
                  {plan.featured && (
                    <span className="absolute -top-3 left-7 rounded-full bg-primary px-3 py-0.5 text-xs font-bold text-primary-foreground">
                      Pour les équipes
                    </span>
                  )}
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="mt-1 min-h-12 text-sm text-muted-foreground">{plan.pitch}</p>
                  <p className="mt-5">
                    <span className="text-4xl font-black tabular-nums">{plan.price}</span>
                    <span className="ml-1 text-sm text-muted-foreground">FCFA / mois</span>
                  </p>
                  <ul className="mt-6 flex-1 space-y-3 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={plan.href}
                    className={buttonVariants({
                      variant: plan.featured ? "default" : "outline",
                      className: "mt-8 h-11 w-full rounded-full",
                    })}
                  >
                    Commencer l&apos;essai
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="scroll-mt-16 py-20 md:py-28">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-center text-3xl font-extrabold tracking-tight sm:text-4xl">Questions fréquentes</h2>
            <div className="mt-10 divide-y border-y">
              {faqs.map((f) => (
                <details key={f.q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left text-lg font-semibold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* APPEL FINAL */}
        <section className="px-4 pb-20 md:pb-28">
          <div className="mx-auto max-w-6xl rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground md:py-20">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Sachez enfin combien vous vendez.</h2>
            <p className="mx-auto mt-4 max-w-xl text-primary-foreground/70">
              Créez votre boutique, ajoutez vos produits et envoyez votre premier lien de paiement aujourd&apos;hui.
            </p>
            <Link
              href="/signup"
              className={buttonVariants({
                variant: "secondary",
                size: "lg",
                className: "mt-8 h-12 rounded-full px-8 text-base",
              })}
            >
              Essayer 20 jours gratuits <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 md:flex-row">
          <Logo className="text-lg" />
          <nav className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/login" className="hover:text-foreground">Connexion</Link>
            <Link href="mailto:support@setlou.com" className="hover:text-foreground">Support</Link>
          </nav>
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Setlou</p>
        </div>
      </footer>
    </div>
  );
}
