"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { 
  CheckCircle2, 
  XCircle, 
  Play, 
  Store, 
  Smartphone, 
  CreditCard, 
  ChevronDown,
  Star,
  ArrowRight,
  Menu,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";

// --- Composants Locaux ---

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="border-b border-border py-6">
      <button 
        className="flex w-full items-center justify-between text-left font-semibold text-lg md:text-xl focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        {question}
        <ChevronDown className={cn("h-6 w-6 text-muted-foreground transition-transform duration-300", isOpen && "rotate-180")} />
      </button>
      <div 
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96 mt-4 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <p className="text-muted-foreground md:text-lg leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 font-bold text-2xl text-primary">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center shadow-lg">
            <Store className="h-6 w-6" />
          </div>
          <span className="tracking-tight">Setlou</span>
        </Link>
        
        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#fonctionnalites" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Comment ça marche</Link>
          <Link href="#demo" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Démo</Link>
          <Link href="#tarifs" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Tarifs</Link>
          <Link href="#faq" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">FAQ</Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-sm font-semibold hover:text-primary transition-colors">
            Se connecter
          </Link>
          <Link href="/signup" className={buttonVariants({ size: "default", className: "rounded-full px-6 shadow-md" })}>
            Créer une boutique
          </Link>
        </div>

        {/* Mobile Nav Toggle */}
        <button className="md:hidden p-2" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background px-4 py-6 flex flex-col gap-4 shadow-xl absolute w-full left-0">
          <Link href="#fonctionnalites" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium py-2 border-b">Comment ça marche</Link>
          <Link href="#demo" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium py-2 border-b">Démo</Link>
          <Link href="#tarifs" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium py-2 border-b">Tarifs</Link>
          <Link href="/login" className="text-lg font-medium py-2 text-primary">Se connecter</Link>
          <Link href="/signup" className={buttonVariants({ size: "lg", className: "w-full mt-4 rounded-full" })}>
            Créer une boutique
          </Link>
        </div>
      )}
    </header>
  );
}

// --- Page Principale ---

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-x-hidden">
      <Navbar />

      <main className="flex-1">
        
        {/* 1. HERO SECTION */}
        <section className="relative pt-24 pb-20 md:pt-32 md:pb-28 px-4 container mx-auto text-center flex flex-col items-center overflow-hidden">
          {/* Background Glows */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] -z-10 opacity-70 pointer-events-none"></div>

          <div className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary mb-8 shadow-sm">
            <span className="flex h-2.5 w-2.5 rounded-full bg-primary mr-3 animate-pulse"></span>
            La nouvelle façon de vendre sur WhatsApp
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter max-w-5xl mb-8 leading-[1.1]">
            Transformez vos conversations WhatsApp en <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">ventes concrètes</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-12 leading-relaxed">
            Fini les commandes perdues dans les messages. Setlou centralise vos ventes, 
            sécurise vos paiements et automatise le suivi. Vendez plus, sans stress.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 w-full justify-center max-w-lg mb-20">
            <Link href="/signup" className={buttonVariants({ size: "lg", className: "w-full sm:w-auto text-lg h-14 px-8 rounded-full shadow-xl hover:shadow-primary/25 transition-all" })}>
              Commencer gratuitement <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link href="#demo" className={buttonVariants({ variant: "outline", size: "lg", className: "w-full sm:w-auto text-lg h-14 px-8 rounded-full border-2 hover:bg-muted" })}>
              <Play className="mr-2 h-5 w-5" /> Voir la démo
            </Link>
          </div>

          <div className="w-full max-w-6xl aspect-video bg-muted/30 rounded-3xl border-4 border-muted shadow-2xl overflow-hidden relative group z-10">
            <iframe 
              className="w-full h-full"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=placeholder" 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen>
            </iframe>
          </div>
        </section>

        {/* 2. PROBLEMES & BÉNÉFICES */}
        <section className="py-20 md:py-28 bg-muted/30 relative">
          <div className="container mx-auto px-4">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Vendre sur WhatsApp est un cauchemar...</h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">Voici comment Setlou rend la vente simple, professionnelle et sécurisée.</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Problèmes */}
              <div className="space-y-8 bg-background p-8 md:p-10 rounded-3xl border shadow-sm">
                <h3 className="text-2xl font-bold text-destructive flex items-center gap-3 mb-8">
                  <XCircle className="h-8 w-8" /> L'ancienne façon de faire
                </h3>
                <ul className="space-y-6">
                  {[
                    "Commandes éparpillées et perdues dans vos discussions.",
                    "Paiements difficiles à vérifier (fausses captures d'écran).",
                    "Les clients se désistent ou oublient de payer.",
                    "Impossible de déléguer sans donner accès à votre téléphone.",
                    "Calcul des revenus manuel et erreurs de comptabilité."
                  ].map((problem, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="mt-1 h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                        <XCircle className="h-5 w-5 text-destructive" />
                      </div>
                      <span className="text-lg text-muted-foreground leading-relaxed">{problem}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bénéfices */}
              <div className="space-y-8 bg-primary/5 p-8 md:p-10 rounded-3xl border border-primary/20 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-32 bg-primary/10 blur-[100px] rounded-full pointer-events-none"></div>
                <h3 className="text-2xl font-bold text-primary flex items-center gap-3 mb-8 relative z-10">
                  <CheckCircle2 className="h-8 w-8" /> Avec Setlou
                </h3>
                <ul className="space-y-6 relative z-10">
                  {[
                    "Centralisation de toutes vos commandes au même endroit.",
                    "Paiements via lien sécurisé, vérifiés automatiquement.",
                    "Relances professionnelles et suivi en un clic.",
                    "Accès sécurisé pour vos assistants (sans partager vos codes).",
                    "Tableau de bord complet avec statistiques en temps réel."
                  ].map((benefit, i) => (
                    <li key={i} className="flex items-start gap-4">
                      <div className="mt-1 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-lg font-medium leading-relaxed">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 3. TÉMOIGNAGES */}
        <section className="py-20 md:py-28">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-20 tracking-tight">Ils ont transformé leur business</h2>
            <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {[
                { name: "Amina Fall", role: "Vendeuse de cosmétiques", text: "Je passais mes soirées à pointer les commandes sur un cahier. Depuis Setlou, tout est automatique. Un gain de temps fou !" },
                { name: "Moussa Diop", role: "Boutique de vêtements", text: "Le fait que mes assistants puissent valider les commandes sans avoir mon WhatsApp a sauvé mon organisation." },
                { name: "Fatou Ndiaye", role: "Traiteur à domicile", text: "Les liens de paiement font tellement plus pro. Mes clients paient plus vite et je n'ai plus de faux reçus." }
              ].map((t, i) => (
                <div key={i} className="p-10 rounded-3xl bg-card border shadow-lg hover:shadow-xl transition-shadow text-left flex flex-col relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="flex gap-1 mb-6 text-yellow-400">
                    {[1,2,3,4,5].map(s => <Star key={s} className="h-5 w-5 fill-current" />)}
                  </div>
                  <p className="text-lg text-muted-foreground italic mb-10 grow leading-relaxed">"{t.text}"</p>
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center font-bold text-lg">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-lg">{t.name}</p>
                      <p className="text-sm text-primary font-medium">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. LA SOLUTION (COMMENT ÇA MARCHE) */}
        <section id="fonctionnalites" className="py-20 md:py-28 bg-slate-950 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px] pointer-events-none translate-x-1/3 -translate-y-1/3"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">La solution la plus simple du marché</h2>
              <p className="text-white/70 text-xl md:text-2xl max-w-3xl mx-auto">
                Pas besoin de site web compliqué. Vous avez juste besoin de Setlou et de WhatsApp.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
              <div className="flex flex-col p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-primary/30 text-white">
                  <Store className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4">1. Créez votre boutique</h3>
                <p className="text-white/70 text-lg leading-relaxed">Ajoutez vos produits, vos prix et vos photos en moins de 2 minutes chrono. Votre catalogue est prêt.</p>
              </div>
              
              <div className="flex flex-col p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-primary/30 text-white">
                  <Smartphone className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4">2. Partagez sur WhatsApp</h3>
                <p className="text-white/70 text-lg leading-relaxed">Envoyez les fiches produits générées par Setlou directement dans vos discussions avec les clients.</p>
              </div>
              
              <div className="flex flex-col p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                <div className="h-16 w-16 bg-primary rounded-2xl flex items-center justify-center mb-8 shadow-lg shadow-primary/30 text-white">
                  <CreditCard className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold mb-4">3. Encaissez et suivez</h3>
                <p className="text-white/70 text-lg leading-relaxed">Le client paie via un lien sécurisé, et la commande s'affiche automatiquement sur votre tableau de bord.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. DEMO VIDEO DETAILLEE (3 MIN) */}
        <section id="demo" className="py-20 md:py-28">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Voyez Setlou en action</h2>
            <p className="text-xl md:text-2xl text-muted-foreground mb-16 max-w-2xl mx-auto">Découvrez comment fonctionne l'outil en 3 minutes top chrono.</p>
            
            <div className="max-w-5xl mx-auto aspect-video bg-muted rounded-3xl overflow-hidden shadow-2xl border-2">
              {/* Vraie iframe pour rendre la démo fonctionnelle (Placeholder YouTube) */}
              <iframe 
                className="w-full h-full"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ?si=placeholder_demo" 
                title="Démo Complète Setlou" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen>
              </iframe>
            </div>
            
            <div className="mt-12">
              <Link href="/signup" className={buttonVariants({ size: "lg", className: "h-14 px-10 rounded-full text-lg shadow-lg" })}>
                Créer ma boutique maintenant
              </Link>
            </div>
          </div>
        </section>

        {/* 6. STORYTELLING / A PROPOS */}
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/5 to-transparent -z-10"></div>
          
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 text-primary mb-10 ring-8 ring-primary/5">
              <Store className="h-12 w-12" />
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black mb-12 tracking-tight">Notre mission</h2>
            
            <div className="space-y-8 text-xl md:text-2xl text-muted-foreground leading-relaxed text-left md:text-center font-medium">
              <p>
                Tout a commencé par un sentiment de frustration profond. En observant de près les e-commerçants de notre entourage, nous avons découvert une <span className="text-foreground font-bold">détresse silencieuse</span>.
              </p>
              <p>
                Sacrifier ses nuits pour scroller frénétiquement WhatsApp, angoisser face aux fausses captures d'écran, et refuser des commandes par épuisement mental... <span className="text-destructive font-bold">C'est une réalité inacceptable.</span>
              </p>
              
              <div className="relative py-12 my-12">
                <div className="absolute left-1/2 -translate-x-1/2 top-0 h-px w-32 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
                <p className="text-2xl md:text-4xl text-foreground font-bold italic tracking-tight leading-snug">
                  "Personne ne devrait avoir à sacrifier sa santé et sa tranquillité d'esprit pour faire grandir son commerce."
                </p>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-0 h-px w-32 bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
              </div>

              <p>
                C'est pour protéger les entrepreneurs qu'est né <span className="text-primary font-extrabold">Setlou</span>. Plus qu'un outil, c'est votre partenaire pour retrouver le sourire, votre temps libre, et la sécurité financière de votre activité.
              </p>
            </div>

            <div className="mt-16 inline-flex flex-col items-center">
              <div className="h-1.5 w-12 bg-primary rounded-full mb-4"></div>
              <p className="font-bold text-lg uppercase tracking-widest text-primary">L'équipe Setlou</p>
            </div>
          </div>
        </section>

        {/* 7. TARIFS */}
        <section id="tarifs" className="py-20 md:py-28">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Un tarif simple et transparent</h2>
            <p className="text-xl text-muted-foreground mb-20 max-w-2xl mx-auto">Rentabilisez votre abonnement dès votre première commande sauvée.</p>
            
            <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">

              {/* PLAN PRO (POPULAIRE) */}
              <div className="bg-background border-2 border-primary rounded-3xl p-10 flex flex-col items-center text-center shadow-2xl relative scale-105 z-10">
                <div className="absolute -top-4 bg-primary text-primary-foreground px-6 py-1.5 rounded-full text-sm font-bold shadow-md">
                  LE PLUS POPULAIRE
                </div>
                <h3 className="text-2xl font-bold mb-4">Pro</h3>
                <div className="mb-6 h-20 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-extrabold">10.000</span>
                  <span className="text-xl text-muted-foreground font-medium">FCFA<br/>/mois</span>
                </div>
                <p className="text-muted-foreground mb-8 min-h-[48px]">Pour les professionnels qui veulent déléguer et exploser leurs ventes.</p>
                <ul className="space-y-4 mb-10 w-full text-left font-medium">
                  <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /><span>Produits & Commandes illimités</span></li>
                  <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /><span>Liens de paiement sécurisés</span></li>
                  <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /><span>Jusqu'à 5 profils assistants</span></li>
                  <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /><span>Statistiques avancées</span></li>
                  <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /><span>Support prioritaire WhatsApp</span></li>
                </ul>
                <Link href="/signup?plan=pro" className={buttonVariants({ className: "w-full rounded-full h-12 text-base mt-auto shadow-lg" })}>
                  Essayer gratuitement 14 jours
                </Link>
              </div>

              {/* PLAN ENTREPRISE */}
              <div className="bg-card border rounded-3xl p-10 flex flex-col items-center text-center hover:shadow-lg transition-shadow relative">
                <h3 className="text-2xl font-bold mb-4">Entreprise</h3>
                <div className="mb-6 h-20 flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-extrabold">19.900</span>
                  <span className="text-xl text-muted-foreground font-medium">FCFA<br/>/mois</span>
                </div>
                <p className="text-muted-foreground mb-8 min-h-[48px]">Pour les grandes équipes et les très gros volumes de vente.</p>
                <ul className="space-y-4 mb-10 w-full text-left font-medium">
                  <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /><span>Tout le plan Pro</span></li>
                  <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /><span>Assistants illimités</span></li>
                  <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /><span>Marque blanche</span></li>
                  <li className="flex items-start gap-3"><CheckCircle2 className="h-5 w-5 text-primary shrink-0" /><span>Accompagnement dédié</span></li>
                </ul>
                <Link href="/signup?plan=entreprise" className={buttonVariants({ variant: "outline", className: "w-full rounded-full h-12 text-base mt-auto" })}>
                  Commencer
                </Link>
              </div>

            </div>
          </div>
        </section>

        {/* 8. FAQ */}
        <section id="faq" className="py-20 md:py-28 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight">Foire aux questions</h2>
              <p className="text-xl text-muted-foreground">Tout ce que vous devez savoir avant de vous lancer.</p>
            </div>
            
            <div className="bg-background rounded-3xl border p-6 md:p-10 shadow-sm">
              <FAQItem 
                question="Ai-je besoin de WhatsApp Business ?"
                answer="Non, Setlou fonctionne très bien même si vous utilisez la version classique de WhatsApp. Cependant, WhatsApp Business offre d'autres avantages complémentaires (comme les réponses rapides) que vous pouvez combiner avec Setlou."
              />
              <FAQItem 
                question="Est-ce que les paiements sont sécurisés ?"
                answer="Absolument. Nous utilisons des fournisseurs de paiement locaux reconnus (Wave, Orange Money, etc.). Les fonds arrivent directement sur vos comptes de manière traçable et sécurisée, empêchant toute fraude."
              />
              <FAQItem 
                question="Mes assistants ont-ils accès à mes revenus ?"
                answer="Non. Grâce à notre gestion stricte des rôles, vos assistants (profils restreints) ne voient que les commandes à préparer et les fiches produits. Le tableau de bord financier et les statistiques vous sont exclusivement réservés."
              />
              <FAQItem 
                question="Que se passe-t-il après l'essai de 14 jours ?"
                answer="À la fin de votre essai, votre boutique sera suspendue jusqu'à ce que vous souscriviez au plan Pro ou Entreprise. Vos données (produits, commandes) seront conservées précieusement sur nos serveurs et vous y aurez de nouveau accès dès le paiement de votre abonnement."
              />
            </div>
            
            <div className="mt-12 text-center">
              <p className="text-muted-foreground">Une autre question ? <Link href="mailto:support@setlou.com" className="text-primary font-medium hover:underline">Contactez notre support</Link></p>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-slate-950 text-slate-300 py-16 border-t border-slate-900">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3 font-bold text-2xl text-white">
              <div className="h-8 w-8 rounded bg-primary text-primary-foreground flex items-center justify-center">
                <Store className="h-5 w-5" />
              </div>
              Setlou
            </div>
            <p className="text-sm text-slate-400 max-w-xs text-center md:text-left">
              La plateforme tout-en-un pour sécuriser et automatiser vos ventes sur WhatsApp.
            </p>
          </div>
          
          <div className="flex gap-8 text-sm font-medium">
            <Link href="/login" className="hover:text-white transition-colors">Connexion</Link>
            <Link href="mailto:support@setlou.com" className="hover:text-white transition-colors">Support</Link>
            <Link href="#" className="hover:text-white transition-colors">Mentions légales</Link>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Setlou. Tous droits réservés. Créé avec passion pour les e-commerçants.
        </div>
      </footer>
    </div>
  );
}
