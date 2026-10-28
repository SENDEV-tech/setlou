import { getOrderByToken } from "@/server/data/supabase-store";
import { formatXOF } from "@/lib/money";
import { applyWaveCheckout, getWaveCheckout, isWaveEnabled } from "@/server/data/wave";
import { PaymentClient } from "./payment-client";

export const metadata = {
  title: "Paiement Sécurisé | Setlou",
};

export const dynamic = "force-dynamic";

export default async function PayPage(props: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ wave?: string }>;
}) {
  const params = await props.params;
  const { wave } = await props.searchParams;
  const token = params.token;
  
  let order;
  try {
    order = await getOrderByToken(token);
  } catch (error: any) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">!</div>
          <h1 className="text-xl font-bold mb-2">Lien invalide</h1>
          <p className="text-muted-foreground mb-4">Ce lien de paiement n'existe pas ou a été supprimé.</p>
          <div className="text-xs text-left p-3 bg-red-50 text-red-800 rounded-md overflow-auto break-all">
            <strong>Détail de l'erreur (pour débug) :</strong><br />
            {error?.message || JSON.stringify(error)}
          </div>
        </div>
      </div>
    );
  }

  const payable = ["pending", "verifying", "expired"].includes(order.status);

  // Retour depuis Wave : on vérifie la session sans attendre le webhook.
  if (payable && order.wave_checkout_id) {
    try {
      const session = await getWaveCheckout(order.shop_id, order.wave_checkout_id);
      if (session && (await applyWaveCheckout(order.shop_id, session))) {
        order = await getOrderByToken(token);
      }
    } catch (error) {
      console.error("Wave sync error:", error);
    }
  }

  const waveEnabled = payable && (await isWaveEnabled(order.shop_id));

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <PaymentClient order={order} token={token} waveEnabled={waveEnabled} waveError={wave === "erreur"} />
    </main>
  );
}
