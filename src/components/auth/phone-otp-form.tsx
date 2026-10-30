"use client";

import { useEffect, useState } from "react";
import { sendPhoneCodeAction, verifyPhoneCodeAction } from "@/app/actions/phone-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatSenegalPhone } from "@/lib/phone";

type Props = {
  mode: "signup" | "login";
  /** Où aller après connexion (ex. paiement Stripe après inscription). */
  redirectTo?: () => string;
};

const RESEND_SECONDS = 60;

export function PhoneOtpForm({ mode, redirectTo }: Props) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [fields, setFields] = useState<FormData | null>(null);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function sendCode(formData: FormData) {
    setLoading(true);
    setError(null);
    formData.set("mode", mode);
    const result = await sendPhoneCodeAction(formData);
    if (result.ok) {
      setFields(formData);
      setPhone(result.data.phone);
      setStep("code");
      setWait(RESEND_SECONDS);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }

  async function verifyCode(formData: FormData) {
    if (!fields) return;
    setLoading(true);
    setError(null);
    for (const [key, value] of fields.entries()) {
      if (!formData.has(key)) formData.set(key, value);
    }
    const result = await verifyPhoneCodeAction(formData);
    if (result.ok) {
      window.location.href = redirectTo ? redirectTo() : result.data.redirectTo;
      return;
    }
    setError(result.error);
    setLoading(false);
  }

  if (step === "code") {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          verifyCode(new FormData(e.currentTarget));
        }}
      >
        <div className="grid gap-4">
          <p className="text-sm text-muted-foreground">
            Entrez le code à 6 chiffres envoyé par SMS au{" "}
            <span className="font-medium text-foreground">{formatSenegalPhone(phone)}</span>.
          </p>
          <div className="grid gap-2">
            <Label htmlFor="code">Code reçu par SMS</Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              placeholder="123456"
              className="text-center text-lg tracking-[0.5em]"
              autoFocus
              required
            />
          </div>

          {error && <div className="text-sm text-red-500 font-medium">{error}</div>}

          <Button type="submit" disabled={loading}>
            {loading ? "Vérification..." : mode === "signup" ? "Créer ma boutique" : "Se connecter"}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              className="text-muted-foreground hover:text-primary"
              onClick={() => {
                setStep("phone");
                setError(null);
              }}
            >
              Changer de numéro
            </button>
            <button
              type="button"
              className="font-medium text-primary disabled:text-muted-foreground"
              disabled={wait > 0 || loading}
              onClick={() => fields && sendCode(fields)}
            >
              {wait > 0 ? `Renvoyer (${wait}s)` : "Renvoyer le code"}
            </button>
          </div>
        </div>
      </form>
    );
  }

  return (
    <form
      // onSubmit plutôt que action : le formulaire garde la saisie en cas d'erreur.
      onSubmit={(e) => {
        e.preventDefault();
        sendCode(new FormData(e.currentTarget));
      }}
    >
      <div className="grid gap-4">
        {mode === "signup" && (
          <>
            <div className="grid gap-2">
              <Label htmlFor="shopName">Nom de la boutique</Label>
              <Input
                id="shopName"
                name="shopName"
                placeholder="Ma Super Boutique"
                autoComplete="off"
                defaultValue={fields?.get("shopName")?.toString()}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fullName">Votre Nom Complet</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder="Astou Ndiaye"
                autoComplete="name"
                defaultValue={fields?.get("fullName")?.toString()}
                required
              />
            </div>
          </>
        )}

        <div className="grid gap-2">
          <Label htmlFor="phone">Numéro de téléphone</Label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-md border border-r-0 bg-muted px-3 text-sm text-muted-foreground">
              +221
            </span>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              placeholder="77 123 45 67"
              className="rounded-l-none"
              defaultValue={fields?.get("phone")?.toString()}
              required
            />
          </div>
          {mode === "signup" && (
            <p className="text-xs text-muted-foreground">
              Vous recevrez un code par SMS. Ce numéro sert aussi de WhatsApp de la boutique.
            </p>
          )}
        </div>

        {error && <div className="text-sm text-red-500 font-medium">{error}</div>}

        <Button type="submit" disabled={loading}>
          {loading ? "Envoi du code..." : "Recevoir le code par SMS"}
        </Button>
      </div>
    </form>
  );
}
