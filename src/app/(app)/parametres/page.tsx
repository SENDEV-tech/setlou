import { getCurrentProfile, getShop } from "@/server/data/supabase-store";
import { getAppOrigin, getWaveStatus } from "@/server/data/wave";
import { SettingsForm } from "@/components/settings/settings-form";
import { WavePaymentCard } from "@/components/settings/wave-payment-card";

export default async function SettingsPage() {
  const shop = await getShop();
  const profile = await getCurrentProfile();
  const isOwner = profile.role === "owner";
  const wave = isOwner ? await getWaveStatus(shop.id) : null;

  return (
    <div className="flex-1 max-w-5xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Paramètres</h2>
        <p className="text-muted-foreground mt-1">
          Gérez les informations de votre boutique, votre identité visuelle et les messages envoyés à vos clients.
        </p>
      </div>
      
      <SettingsForm shop={shop} />

      {wave && (
        <WavePaymentCard
          connected={wave.connected}
          apiKeyLast4={wave.apiKeyLast4}
          webhookUrl={`${await getAppOrigin()}/api/wave/webhook/${shop.id}`}
        />
      )}
    </div>
  );
}
