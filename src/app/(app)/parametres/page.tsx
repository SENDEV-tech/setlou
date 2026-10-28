import { getShop } from "@/server/data/supabase-store";
import { SettingsForm } from "@/components/settings/settings-form";

export default async function SettingsPage() {
  const shop = await getShop();

  return (
    <div className="flex-1 max-w-5xl">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Paramètres</h2>
        <p className="text-muted-foreground mt-1">
          Gérez les informations de votre boutique, votre identité visuelle et les messages envoyés à vos clients.
        </p>
      </div>
      
      <SettingsForm shop={shop} />
    </div>
  );
}
