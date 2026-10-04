"use client";

import { useState } from "react";
import { signupAction } from "@/app/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Store } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function SignupPage() {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [requireEmail, setRequireEmail] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await signupAction(formData);
    if (result?.error) {
      setError(result.error);
    } else if (result?.success) {
      setSuccess(true);
      if (result.requireEmailConfirmation) {
        setRequireEmail(true);
      } else {
        const urlParams = new URLSearchParams(window.location.search);
        const plan = urlParams.get("plan");
        window.location.href = plan ? `/api/stripe/checkout?plan=${plan}` : "/tableau-de-bord";
      }
    }
    setLoading(false);
  }

  async function handleGoogleSignup() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const urlParams = new URLSearchParams(window.location.search);
    const plan = urlParams.get("plan");
    const nextUrl = plan ? `/api/stripe/checkout?plan=${plan}` : "/tableau-de-bord";
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextUrl)}`,
      }
    });

    if (error) {
      setError("Erreur lors de la connexion avec Google.");
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col space-y-6 sm:w-[350px]">
      <div className="flex flex-col items-center space-y-2 text-center">
        <Link href="/" className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 hover:bg-primary/20 transition-colors">
          <Store className="h-6 w-6" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">
          {success ? "Boutique créée !" : "Créer votre boutique"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {success 
            ? "Félicitations, votre espace a été configuré avec succès."
            : "Rejoignez Setlou et commencez à vendre"}
        </p>
      </div>

      {success ? (
        <div className="grid gap-6 text-center">
          {requireEmail ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg text-sm">
              <p className="font-semibold mb-2">Vérifiez votre boîte mail</p>
              <p>Nous vous avons envoyé un lien de confirmation. Veuillez cliquer sur ce lien avant de vous connecter.</p>
            </div>
          ) : (
            <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 p-4 rounded-lg text-sm">
              <p>Redirection vers votre tableau de bord en cours...</p>
            </div>
          )}
          
          <Link 
            href="/login"
            className={buttonVariants({ className: "mt-4" })}
          >
            Aller à la page de connexion
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
        <form action={handleSubmit}>
          <div className="grid gap-4">
            
            <div className="grid gap-2">
              <Label htmlFor="shopName">Nom de la boutique</Label>
              <Input
                id="shopName"
                name="shopName"
                placeholder="Ma Super Boutique"
                autoComplete="off"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="fullName">Votre Nom Complet</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Astou Ndiaye"
                autoComplete="off"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="whatsapp">Numéro WhatsApp</Label>
              <Input
                id="whatsapp"
                name="whatsapp"
                placeholder="+221 77 000 00 00"
                autoComplete="off"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email professionnel</Label>
              <Input
                id="email"
                name="email"
                placeholder="contact@boutique.com"
                type="email"
                autoCapitalize="none"
                autoComplete="off"
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="off"
                required
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-500 font-medium">
                {error}
              </div>
            )}
            
            <Button type="submit" disabled={loading}>
              {loading ? "Création en cours..." : "S'inscrire"}
            </Button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Ou continuer avec
            </span>
          </div>
        </div>

        <Button variant="outline" type="button" disabled={loading} onClick={handleGoogleSignup}>
          <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.7 17.74 9.5 24 9.5z"></path>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
            <path fill="none" d="M0 0h48v48H0z"></path>
          </svg>
          Google
        </Button>

        </div>
      )}
      
      <p className="px-8 text-center text-sm text-muted-foreground">
        Déjà un compte ?{" "}
        <Link
          href="/login"
          className="underline underline-offset-4 hover:text-primary"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
