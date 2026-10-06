import { getOrderByToken } from "@/server/data/supabase-store";
import { formatXOF } from "@/lib/money";
import { PaymentClient } from "./payment-client";

export const metadata = {
  title: "Paiement Sécurisé | Setlou",
};

export const dynamic = "force-dynamic";

export default async function PayPage({ params }: { params: { token: string } }) {
  // Wait for params in Next 15 (if needed) but let's assume it's directly accessible or await it.
  const token = params.token;
  
  let order;
  try {
    order = await getOrderByToken(token);
  } catch (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-sm border max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">!</div>
          <h1 className="text-xl font-bold mb-2">Lien invalide</h1>
          <p className="text-muted-foreground">Ce lien de paiement n'existe pas ou a été supprimé.</p>
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
