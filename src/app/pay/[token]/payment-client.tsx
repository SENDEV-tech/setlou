"use client";

import { useState } from "react";
import { formatXOF } from "@/lib/money";
import { CheckCircle2, Copy, ShieldCheck, Smartphone, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { markAsVerifyingAction } from "@/app/actions/order";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function PaymentClient({ order, token }: { order: any; token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isAlreadyPaid = order.status === "paid";
  const isVerifying = order.status === "verifying";
  const isPending = order.status === "pending";

  const shopPhone = order.shop.whatsapp_number;
  const cleanPhone = shopPhone?.replace(/[^0-9]/g, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanPhone || shopPhone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Numéro copié !");
  };

  const handleConfirm = async () => {
    setLoading(true);
    const result = await markAsVerifyingAction(token);
    setLoading(false);
    if (result.success) {
      router.refresh(); // Refresh the server component to get new order status
    } else {
      toast.error("Une erreur est survenue.");
    }
  };

  if (isAlreadyPaid) {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Paiement validé</h1>
        <p className="text-muted-foreground mb-6">
          Votre paiement a été confirmé par <strong>{order.shop.name}</strong>. Merci pour votre confiance !
        </p>
      </div>
    );
  }

  if (isVerifying) {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border max-w-md w-full text-center">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck className="w-10 h-10 animate-pulse" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Vérification en cours...</h1>
        <p className="text-muted-foreground mb-6">
          Nous avons bien noté votre confirmation. <strong>{order.shop.name}</strong> est en train de vérifier la réception du transfert.
        </p>
        <p className="text-sm bg-muted p-4 rounded-xl">
          Vous recevrez votre commande très prochainement.
        </p>
      </div>
    );
  }

  if (order.status === "cancelled" || order.status === "expired") {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-sm border max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">X</div>
        <h1 className="text-xl font-bold mb-2">Commande annulée</h1>
        <p className="text-muted-foreground">Cette commande a été annulée ou a expiré.</p>
      </div>
    );
  }

  // Pending View
  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border max-w-md w-full overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-slate-900 p-6 text-white text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        <div className="relative z-10">
          <p className="text-slate-400 text-sm mb-1 uppercase tracking-wider font-semibold">Paiement Sécurisé</p>
          <h1 className="text-2xl font-bold mb-4">{order.shop.name}</h1>
          <div className="text-5xl font-black mb-2">{formatXOF(order.total_xof)}</div>
          <p className="text-slate-300 text-sm">Réf : {order.reference}</p>
        </div>
      </div>

      <div className="p-6 md:p-8 space-y-8">
        {/* Order Details */}
        <div className="space-y-3 text-sm">
          <h3 className="font-semibold text-slate-900 border-b pb-2 mb-3">Détails de la commande</h3>
          {order.order_items.map((item: any, idx: number) => (
            <div key={idx} className="flex justify-between items-center">
              <span className="text-slate-600"><span className="font-medium">{item.quantity}x</span> {item.product_name}</span>
              <span className="font-medium">{formatXOF(item.line_total_xof)}</span>
            </div>
          ))}
          {order.delivery_fee_xof > 0 && (
            <div className="flex justify-between items-center text-slate-500">
              <span>Frais de livraison</span>
              <span>{formatXOF(order.delivery_fee_xof)}</span>
            </div>
          )}
        </div>

        {/* Payment Instructions */}
        <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-4">
          <div className="flex gap-3">
            <div className="bg-blue-100 text-blue-600 rounded-full p-2 h-fit">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-1">Comment payer ?</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Envoyez exactement <strong className="text-slate-900">{formatXOF(order.total_xof)}</strong> au numéro ci-dessous via Wave ou Orange Money :
              </p>
            </div>
          </div>
          
          <div className="bg-white border rounded-xl p-3 flex items-center justify-between shadow-sm">
            <span className="text-lg font-bold tracking-wider text-slate-800">{shopPhone}</span>
            <Button variant="secondary" size="sm" onClick={handleCopy} className="h-8">
              {copied ? <Check className="w-4 h-4 mr-1 text-green-600" /> : <Copy className="w-4 h-4 mr-1" />}
              {copied ? "Copié" : "Copier"}
            </Button>
          </div>
        </div>

        {/* Action */}
        <div className="pt-2">
          <Button 
            className="w-full h-14 text-lg font-bold rounded-xl shadow-lg shadow-primary/25" 
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Chargement..." : "J'ai effectué le transfert"}
          </Button>
          <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
            <ShieldCheck className="w-4 h-4" />
            Vérification manuelle par la boutique
          </p>
        </div>
      </div>
    </div>
  );
}
