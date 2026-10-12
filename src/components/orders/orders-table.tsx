"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatXOF } from "@/lib/money";
import { Button, buttonVariants } from "@/components/ui/button";
import { validateOrderPaymentAction } from "@/app/actions/order";
import { toast } from "sonner";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Copy, Check, MessageCircle, ExternalLink, Link2, User, Phone } from "lucide-react";

interface OrdersTableProps {
  orders: any[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600">Payé</Badge>;
      case 'verifying':
        return <Badge className="bg-amber-500 hover:bg-amber-600 animate-pulse">Vérification</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-orange-500 border-orange-500">En attente</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Annulé</Badge>;
      case 'expired':
        return <Badge variant="secondary">Expiré</Badge>;
      case 'refunded':
        return <Badge variant="outline">Remboursé</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "https://setlou.com";
  const selectedPaymentLink = selectedOrder
    ? (selectedOrder.token_hash
        ? `${origin}/pay/${selectedOrder.token_hash}`
        : `${origin}/pay/${selectedOrder.id}`)
    : "";

  const customerName = selectedOrder?.customer?.full_name || selectedOrder?.snapshot?.name || "Client";
  const customerPhone = selectedOrder?.customer?.phone || selectedOrder?.snapshot?.phone || "";
  const cleanPhone = customerPhone.replace(/[^0-9]/g, "");

  const handleCopyLink = () => {
    if (selectedPaymentLink) {
      navigator.clipboard.writeText(selectedPaymentLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Lien copié dans le presse-papier !");
    }
  };

  const whatsappMessage = selectedOrder
    ? `Bonjour ${customerName !== "Client" ? customerName : ""}, voici le lien de paiement sécurisé pour votre commande ${selectedOrder.reference} d'un montant de ${formatXOF(selectedOrder.total_xof)} : ${selectedPaymentLink}`
    : "";

  const whatsappUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappMessage)}`
    : `https://wa.me/?text=${encodeURIComponent(whatsappMessage)}`;

  return (
    <>
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-primary/10 text-primary">
            Astuce
          </span>
          <span>Double-cliquez sur une commande pour revoir et copier son lien de paiement.</span>
        </div>
        <span>{orders.length} commande{orders.length > 1 ? "s" : ""}</span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Créé par</TableHead>
              <TableHead className="text-right">Montant</TableHead>
              <TableHead className="w-24 text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow 
                key={order.id}
                onDoubleClick={() => setSelectedOrder(order)}
                className="cursor-pointer hover:bg-muted/50 transition-colors select-none"
                title="Double-cliquez pour revoir le lien de paiement"
              >
                <TableCell className="font-medium">{order.reference}</TableCell>
                <TableCell>
                  {order.customer?.full_name || order.snapshot?.name}
                  <div className="text-xs text-muted-foreground">{order.customer?.phone || order.snapshot?.phone}</div>
                </TableCell>
                <TableCell>{new Date(order.created_at).toLocaleString("fr-SN")}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell>{order.creator?.full_name}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatXOF(order.total_xof)}
                </TableCell>
                <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={() => setSelectedOrder(order)}
                      title="Revoir le lien de paiement"
                    >
                      <Link2 className="h-4 w-4" />
                    </Button>
                    {order.status === 'verifying' && (
                      <Button 
                        size="sm" 
                        className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white ml-1"
                        onClick={async () => {
                          const loadingToast = toast.loading("Validation en cours...");
                          const result = await validateOrderPaymentAction(order.id);
                          if (result.success) {
                            toast.success("Paiement validé !", { id: loadingToast });
                          } else {
                            toast.error("Erreur", { id: loadingToast });
                          }
                        }}
                      >
                        Valider
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {orders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                  Aucune commande trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog 
        open={!!selectedOrder} 
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
            setCopied(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg p-6 rounded-2xl">
          {selectedOrder && (
            <div className="space-y-5">
              <DialogHeader className="text-left space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Détails Commande
                  </span>
                  {getStatusBadge(selectedOrder.status)}
                </div>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Link2 className="h-5 w-5 text-primary" />
                  {selectedOrder.reference}
                </DialogTitle>
                <DialogDescription>
                  Lien de paiement sécurisé et récapitulatif pour ce client.
                </DialogDescription>
              </DialogHeader>

              {/* Infos client et montant */}
              <div className="bg-muted/40 rounded-xl p-4 space-y-3 text-sm border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold text-foreground">{customerName}</span>
                  </div>
                  {customerPhone && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {customerPhone}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-xs text-muted-foreground">Montant total</span>
                  <span className="text-base font-bold text-primary">
                    {formatXOF(selectedOrder.total_xof)}
                  </span>
                </div>

                {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                  <div className="pt-2 border-t border-border/50 text-xs text-muted-foreground space-y-1">
                    {selectedOrder.order_items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between">
                        <span>{item.quantity}x {item.product_name}</span>
                        <span className="font-medium text-foreground">{formatXOF(item.line_total_xof)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lien de paiement & Bouton Copier */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground">
                  Lien de paiement sécurisé
                </label>
                <div className="p-3 bg-muted/60 rounded-xl flex items-center gap-2 border shadow-inner">
                  <span className="text-xs font-mono truncate select-all flex-1 text-left font-medium">
                    {selectedPaymentLink}
                  </span>
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={handleCopyLink}
                    className={`shrink-0 transition-all duration-200 ${
                      copied
                        ? "bg-green-100 text-green-600 border border-green-300 hover:bg-green-200 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800"
                        : "hover:bg-primary hover:text-primary-foreground"
                    }`}
                    title={copied ? "Copié !" : "Copier le lien"}
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 animate-in zoom-in-75 duration-200" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    className: "flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-sm font-medium",
                    size: "default",
                  })}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Envoyer sur WhatsApp
                </a>
                <a
                  href={selectedPaymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({
                    variant: "outline",
                    size: "default",
                    className: "flex-1 font-medium",
                  })}
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Ouvrir la page
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

