"use client";

import { useState } from "react";
import { signupAction } from "@/app/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Store } from "lucide-react";

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
        window.location.href = "/tableau-de-bord";
      }
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col space-y-6 sm:w-[350px]">
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <Store className="h-6 w-6" />
        </div>
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
