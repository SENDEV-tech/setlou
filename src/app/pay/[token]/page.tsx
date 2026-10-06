import { getOrderByToken } from "@/server/data/supabase-store";
import { formatXOF } from "@/lib/money";
import { PaymentClient } from "./payment-client";

export const metadata = {
  title: "Paiement Sécurisé | Setlou",
};

export const dynamic = "force-dynamic";

export default async function PayPage(props: { params: Promise<{ token: string }> }) {
  const params = await props.params;
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

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <PaymentClient order={order} token={token} />
    </main>
  );
}
