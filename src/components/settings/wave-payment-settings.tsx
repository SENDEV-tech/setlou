"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Check, Copy, ExternalLink, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { disconnectWaveAccountAction, saveWaveAccountAction } from "@/app/actions/payments";
import type { ShopWaveStatus } from "@/server/data/shop-wave";

// Affiché dans le formulaire des paramètres : les champs n'ont pas d'attribut « name »
// pour ne pas partir avec le formulaire principal, et les boutons sont en type="button".
export function WavePaymentSettings({ initialStatus }: { initialStatus: ShopWaveStatus }) {
  const [status, setStatus] = useState(initialStatus);
  const [apiKey, setApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [errors, setErrors] = useState<{ apiKey?: string; webhookSecret?: string }>({});
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!status.available) {
    return (
      <p className="text-sm text-muted-foreground max-w-xl">
        Le paiement Wave en ligne sera bientôt disponible. En attendant, vos clients paient par transfert et vous validez la commande.
      </p>
    );
  }

  const save = async () => {
    setSaving(true);
    setErrors({});
    const result = await saveWaveAccountAction({ apiKey, webhookSecret });
    setSaving(false);
    if (result.ok) {
      setStatus(result.data);
      setApiKey("");
      setWebhookSecret("");
      toast.success(status.connected ? "Compte Wave mis à jour." : "Compte Wave connecté !");
    } else {
      setErrors({ apiKey: result.fieldErrors?.apiKey?.[0], webhookSecret: result.fieldErrors?.webhookSecret?.[0] });
      toast.error(result.error);
    }
  };

  const disconnect = async () => {
    setSaving(true);
    const result = await disconnectWaveAccountAction();
    setSaving(false);
    if (result.ok) {
      setStatus({ ...status, connected: false, apiKeyLast4: null, hasWebhookSecret: false, webhookUrl: null });
      toast.success("Compte Wave déconnecté.");
    } else {
      toast.error(result.error);
    }
  };

  const copyWebhook = () => {
    if (!status.webhookUrl) return;
    navigator.clipboard.writeText(status.webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-xl">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">Paiement Wave en ligne</h3>
        <p className="text-sm text-muted-foreground">
          Vos clients paient la commande avec Wave depuis le lien de paiement. L&apos;argent arrive directement sur votre compte
          Wave Business et la commande passe en « Payée » toute seule.
        </p>
      </div>

      <div className={`rounded-2xl border p-4 flex items-start gap-3 ${status.connected ? "bg-green-50 border-green-200" : "bg-muted/40"}`}>
        <Wallet className={`w-5 h-5 mt-0.5 shrink-0 ${status.connected ? "text-green-600" : "text-muted-foreground"}`} />
        <div className="text-sm">
          {status.connected ? (
            <>
              <p className="font-semibold text-green-800">Wave connecté</p>
              <p className="text-green-700">Clé API se terminant par ••••{status.apiKeyLast4}.</p>
              {!status.hasWebhookSecret && (
                <p className="text-amber-700 mt-1">
                  Ajoutez le webhook (étape 3) : sans lui, une commande n&apos;est validée que si le client revient sur Setlou après avoir payé.
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground">Pas encore connecté : vos clients paient par transfert et vous validez à la main.</p>
          )}
        </div>
      </div>

      <ol className="space-y-5 text-sm">
        <li className="space-y-2">
          <p className="font-medium">
            1. Ouvrez{" "}
            <a href="https://business.wave.com" target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">
              votre portail Wave Business <ExternalLink className="w-3 h-3" />
            </a>{" "}
            puis la section Développeurs.
          </p>
        </li>
        <li className="space-y-2">
          <p className="font-medium">2. Créez une clé API avec l&apos;accès « Checkout API » et collez-la ici.</p>
          <Input
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={status.connected ? `Clé actuelle ••••${status.apiKeyLast4} (laisser vide pour la garder)` : "wave_sn_prod_..."}
            aria-invalid={!!errors.apiKey}
          />
          {errors.apiKey && <p className="text-xs text-destructive">{errors.apiKey}</p>}
        </li>
        <li className="space-y-2">
          <p className="font-medium">3. Ajoutez un webhook avec l&apos;événement « checkout.session.completed ».</p>
          {status.webhookUrl ? (
            <>
              <p className="text-muted-foreground">Adresse à coller dans Wave :</p>
              <div className="flex items-center gap-2 rounded-lg border bg-background p-2">
                <code className="text-xs break-all flex-1">{status.webhookUrl}</code>
                <Button type="button" variant="secondary" size="sm" onClick={copyWebhook} className="shrink-0">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-muted-foreground">Puis collez ici le « Signing secret » que Wave affiche :</p>
              <Input
                type="password"
                autoComplete="off"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                placeholder={status.hasWebhookSecret ? "Secret enregistré (laisser vide pour le garder)" : "wave_sn_WHS_..."}
                aria-invalid={!!errors.webhookSecret}
              />
              {errors.webhookSecret && <p className="text-xs text-destructive">{errors.webhookSecret}</p>}
            </>
          ) : (
            <p className="text-muted-foreground">L&apos;adresse du webhook s&apos;affiche ici dès que la clé API est enregistrée.</p>
          )}
        </li>
      </ol>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={save} disabled={saving || (!apiKey && !webhookSecret)}>
          {saving ? "Vérification..." : status.connected ? "Mettre à jour" : "Connecter Wave"}
        </Button>
        {status.connected && (
          <Button type="button" variant="outline" onClick={disconnect} disabled={saving}>
            Déconnecter
          </Button>
        )}
      </div>
    </div>
  );
}
