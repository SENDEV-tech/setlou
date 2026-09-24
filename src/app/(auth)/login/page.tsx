"use client";

import { useState } from "react";
import { loginAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Store } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await loginAction(formData);
    if (result?.error) {
      setError(result.error);
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
          Bienvenue sur Setlou
        </h1>
        <p className="text-sm text-muted-foreground">
          Connectez-vous pour gérer votre boutique
        </p>
      </div>

      <div className="grid gap-6">
        <form action={handleSubmit}>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email ou Nom d'utilisateur</Label>
              <Input
                id="email"
                name="email"
                placeholder="nom@exemple.com ou awa_ast"
                type="text"
                autoCapitalize="none"
                autoComplete="off"
                autoCorrect="off"
                required
              />
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                <Link
                  href="#"
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
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
              {loading ? "Connexion en cours..." : "Se connecter"}
            </Button>
          </div>
        </form>
      </div>
      
      <p className="px-8 text-center text-sm text-muted-foreground">
        Vous n'avez pas de compte ?{" "}
        <Link
          href="/signup"
          className="underline underline-offset-4 hover:text-primary"
        >
          Créer une boutique
        </Link>
      </p>
    </div>
  );
}
