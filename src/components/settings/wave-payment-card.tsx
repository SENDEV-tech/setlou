"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, Copy, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { disconnectWaveAction, saveWaveSettingsAction } from "@/app/actions/wave";

interface WavePaymentCardProps {
  connected: boolean;
  apiKeyLast4: string | null;
  webhookUrl: string;
}

export function WavePaymentCard({ connected, apiKeyLast4, webhookUrl }: WavePaymentCardProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(!connected);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[] | undefined>>({});

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const result = await saveWaveSettingsAction(new FormData(e.currentTarget));
    setLoading(false);
    if (result.ok) {
      toast.success("Wave est connecté. Vos clients peuvent payer avec Wave.");
      setFieldErrors({});
      setEditing(false);
      router.refresh();
    } else {
      setFieldErrors(result.fieldErrors ?? {});
      toast.error(result.error);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    const result = await disconnectWaveAction();
    setLoading(false);
    if (result.ok) {
      toast.success("Wave déconnecté.");
      setEditing(true);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="mt-8 bg-card border rounded-xl p-4 sm:p-6 shadow-sm max-w-4xl space-y-5">
      <div className="flex items-start gap-3">
        <div className="rounded-full p-2 text-white" style={{ backgroundColor: "#1DC4FF" }}>
          <Wallet className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium">Paiement Wave</h3>
          <p className="text-sm text-muted-foreground">
            Vos clients paient avec Wave depuis leur lien, l'argent arrive sur votre compte Wave Business
            et la commande passe en « payée » automatiquement.
          </p>
        </div>
        {connected && (
          <span className="text-xs font-medium text-green-700 bg-green-100 rounded-full px-2.5 py-1 whitespace-nowrap">
            Connecté
          </span>
        )}
      </div>

      {connected && !editing ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <p className="text-sm text-muted-foreground">Clé API se terminant par <strong>…{apiKeyLast4}</strong></p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditing(true)}>Remplacer les clés</Button>
            <Button type="button" variant="ghost" size="sm" onClick={handleDisconnect} disabled={loading} className="text-red-600">
              Déconnecter
            </Button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid gap-4 max-w-xl" autoComplete="off">
          <ol className="text-sm text-muted-foreground list-decimal pl-5 space-y-1">
            <li>Sur business.wave.com, ouvrez Développeurs et créez une clé API avec l'accès « Checkout » (sans signature des requêtes).</li>
            <li>Dans Développeurs → Webhooks, ajoutez l'URL ci-dessous, choisissez « Signing secret » et cochez les événements checkout.session.</li>
            <li>Collez ici la clé API et le secret du webhook.</li>
          </ol>

          <div className="space-y-2">
            <label className="text-sm font-medium">URL du webhook</label>
            <div className="flex gap-2">
              <Input value={webhookUrl} readOnly className="font-mono text-xs" />
              <Button type="button" variant="secondary" onClick={handleCopy} className="shrink-0">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="apiKey" className="text-sm font-medium">Clé API Wave</label>
            <Input id="apiKey" name="apiKey" type="password" placeholder="wave_sn_prod_..." required />
            {fieldErrors.apiKey && <p className="text-xs text-red-600">{fieldErrors.apiKey[0]}</p>}
          </div>

          <div className="space-y-2">
            <label htmlFor="webhookSecret" className="text-sm font-medium">Secret du webhook</label>
            <Input id="webhookSecret" name="webhookSecret" type="password" placeholder="wave_sn_WHS_..." required />
            {fieldErrors.webhookSecret && <p className="text-xs text-red-600">{fieldErrors.webhookSecret[0]}</p>}
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? "Vérification..." : "Connecter Wave"}</Button>
            {connected && (
              <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Annuler</Button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
