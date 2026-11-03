"use client";

import { useState } from "react";
import { LockKeyhole } from "lucide-react";
import { resetPasswordAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

export function ResetPasswordForm({ email }: { email: string | null }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    // En cas de succès, l'action redirige vers le tableau de bord.
    const result = await resetPasswordAction(formData);
    if (!result.ok) {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col space-y-6 sm:w-[350px]">
      <div className="flex flex-col items-center space-y-2 text-center">
        <div className="h-12 w-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4">
          <LockKeyhole className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Nouveau mot de passe</h1>
        <p className="text-sm text-muted-foreground">
          {email ? (
            <>
              Choisissez un nouveau mot de passe pour{" "}
              <span className="font-medium text-foreground break-all">{email}</span>.
            </>
          ) : (
            "Choisissez un nouveau mot de passe pour votre compte."
          )}
        </p>
      </div>

      <form action={handleSubmit}>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="password">Nouveau mot de passe</Label>
            <PasswordInput
              id="password"
              name="password"
              autoComplete="new-password"
              minLength={6}
              required
            />
            <p className="text-xs text-muted-foreground">Au moins 6 caractères.</p>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm">Confirmer le mot de passe</Label>
            <PasswordInput
              id="confirm"
              name="confirm"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </div>

          {error && <div className="text-sm text-red-500 font-medium">{error}</div>}

          <Button type="submit" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer et me connecter"}
          </Button>
        </div>
      </form>
    </div>
  );
}
