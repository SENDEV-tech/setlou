"use client";

import { useState } from "react";
import Link from "next/link";
import { KeyRound, MailCheck } from "lucide-react";
import { forgotPasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPasswordForm({ linkExpired }: { linkExpired: boolean }) {
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    const result = await forgotPasswordAction(formData);
    if (result.ok) {
      setSentTo(String(formData.get("email") ?? "").trim());
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col space-y-6 sm:w-[350px]">
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          {sentTo ? <MailCheck className="h-6 w-6" /> : <KeyRound className="h-6 w-6" />}
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">
          {sentTo ? "Vérifiez votre boîte mail" : "Mot de passe oublié ?"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {sentTo
            ? "Si un compte existe pour cette adresse, vous allez recevoir un lien pour choisir un nouveau mot de passe."
            : "Entrez l'email de votre compte, nous vous envoyons un lien pour le réinitialiser."}
        </p>
      </div>

      {sentTo ? (
        <div className="grid gap-4 text-center">
          <div className="bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 p-4 rounded-lg text-sm">
            <p>
              Email envoyé à <span className="font-semibold break-all">{sentTo}</span>.
            </p>
            <p className="mt-2">Pensez à regarder dans les spams. Le lien est valable 1 heure.</p>
          </div>
          <Button variant="outline" type="button" onClick={() => setSentTo(null)}>
            Renvoyer ou changer d&apos;adresse
          </Button>
        </div>
      ) : (
        <form action={handleSubmit}>
          <div className="grid gap-4">
            {linkExpired && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-3 rounded-lg text-sm">
                Ce lien n&apos;est plus valable. Refaites une demande ci-dessous, puis ouvrez le
                nouveau lien sur ce même téléphone ou ordinateur.
              </div>
            )}
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                inputMode="email"
                placeholder="nom@exemple.com"
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect="off"
                required
              />
            </div>

            {error && <div className="text-sm text-red-500 font-medium">{error}</div>}

            <Button type="submit" disabled={loading}>
              {loading ? "Envoi en cours..." : "Envoyer le lien"}
            </Button>
          </div>
        </form>
      )}

      <p className="px-8 text-center text-sm text-muted-foreground">
        <Link href="/login" className="underline underline-offset-4 hover:text-primary">
          Retour à la connexion
        </Link>
      </p>
    </div>
  );
}
