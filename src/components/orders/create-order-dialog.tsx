"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, CopyIcon, User, Phone, Package, Truck, CheckCircle2, MessageCircle } from "lucide-react";
import { createOrderAction } from "@/app/actions/order";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatXOF } from "@/lib/money";

interface CreateOrderDialogProps {
  products: any[];
}

export function CreateOrderDialog({ products }: CreateOrderDialogProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [paymentLink, setPaymentLink] = React.useState<string | null>(null);

  const [selectedProductId, setSelectedProductId] = React.useState<string>("");
  const [quantity, setQuantity] = React.useState<number>(1);
  const [deliveryFee, setDeliveryFee] = React.useState<number>(1000);

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const total = (selectedProduct?.price_xof || 0) * quantity + deliveryFee;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("productId", selectedProductId);
      formData.append("quantity", quantity.toString());
      formData.append("deliveryFee", deliveryFee.toString());
      
      const result = await createOrderAction(formData);
      
      if (result.success) {
        setPaymentLink(result.paymentLink);
        toast.success("Commande créée avec succès !");
      }
    } catch (error) {
      toast.error("Erreur lors de la création de la commande.");
    } finally {
      setLoading(false);
    }
  };

  const resetAndClose = () => {
    setOpen(false);
    setTimeout(() => {
      setPaymentLink(null);
      setSelectedProductId("");
      setQuantity(1);
      setDeliveryFee(1000);
    }, 300);
  };

  const copyToClipboard = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      toast.info("Lien copié dans le presse-papier !");
    }
  };

  return (
    <>
      <Button size="lg" className="shadow-lg hover:shadow-xl transition-all duration-300" onClick={() => setOpen(true)}>
        <PlusIcon className="mr-2 h-5 w-5" />
        Nouveau lien de paiement
      </Button>

      <Dialog open={open} onOpenChange={(val) => {
        if (!val) resetAndClose();
        else setOpen(val);
      }}>
        <DialogContent className="sm:max-w-2xl overflow-hidden p-0 border-0 shadow-2xl rounded-2xl">
        {!paymentLink ? (
          <div className="flex flex-col md:flex-row h-full max-h-[85vh]">
            {/* Colonne Formulaire */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-2xl font-bold">Nouvelle Commande</DialogTitle>
                <DialogDescription>
                  Générez un lien de paiement sécurisé pour votre client.
                </DialogDescription>
              </DialogHeader>

              <form id="order-form" onSubmit={handleSubmit} className="space-y-6" autoComplete="off">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <User className="w-4 h-4" />
                    <h3>Client</h3>
                  </div>
                  <div className="space-y-3">
                    <Input id="customerName" name="customerName" placeholder="Nom complet (ex: Awa Fall)" required className="bg-muted/50 border-transparent focus-visible:bg-transparent" />
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="customerPhone" name="customerPhone" type="tel" placeholder="+221 77 123 45 67" required className="pl-10 bg-muted/50 border-transparent focus-visible:bg-transparent" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <Package className="w-4 h-4" />
                    <h3>Détails</h3>
                  </div>
                  <div className="space-y-3">
                    <Select value={selectedProductId} onValueChange={setSelectedProductId} required>
                      <SelectTrigger className="bg-muted/50 border-transparent focus:bg-transparent">
                        <SelectValue placeholder="Sélectionnez un produit" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map(p => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} - {formatXOF(p.price_xof)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground ml-1">Quantité</label>
                        <Input 
                          id="quantity" 
                          type="number" 
                          min="1" 
                          value={quantity} 
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} 
                          required 
                          className="bg-muted/50 border-transparent focus-visible:bg-transparent"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Livraison
                        </label>
                        <Input 
                          id="deliveryFee" 
                          type="number" 
                          min="0" 
                          value={deliveryFee} 
                          onChange={(e) => setDeliveryFee(parseInt(e.target.value) || 0)} 
                          className="bg-muted/50 border-transparent focus-visible:bg-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Colonne Récapitulatif (côté droit avec fond) */}
            <div className="w-full md:w-1/3 bg-slate-50 dark:bg-slate-900 p-6 md:p-8 flex flex-col justify-between border-l">
              <div>
                <h3 className="font-semibold mb-6">Récapitulatif</h3>
                
                <div className="space-y-4 text-sm">
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Sous-total</span>
                    <span className="font-medium text-foreground">{formatXOF((selectedProduct?.price_xof || 0) * quantity)}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span>Frais Livraison</span>
                    <span className="font-medium text-foreground">{formatXOF(deliveryFee)}</span>
                  </div>
                  <div className="h-px bg-border w-full my-2"></div>
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">{formatXOF(total)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <Button 
                  type="submit" 
                  form="order-form"
                  className="w-full shadow-lg" 
                  size="lg"
                  disabled={loading || !selectedProductId}
                >
                  {loading ? "Génération en cours..." : "Générer le lien"}
                </Button>
                <p className="text-xs text-center text-muted-foreground mt-4">
                  Paiement sécurisé via Wave / OM
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Écran de succès */
          <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center animate-in zoom-in duration-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            
            <div className="space-y-2 max-w-sm">
              <h3 className="text-2xl font-bold">Lien prêt à l'envoi !</h3>
              <p className="text-muted-foreground">
                Votre client pourra payer directement en cliquant sur ce lien sécurisé.
              </p>
            </div>
            
            <div className="w-full max-w-md p-4 bg-muted/50 rounded-xl flex items-center gap-3 border shadow-sm">
              <span className="text-sm truncate select-all flex-1 text-left font-medium">{paymentLink}</span>
              <Button variant="secondary" size="icon" onClick={copyToClipboard} className="shrink-0 hover:bg-primary hover:text-primary-foreground transition-colors">
                <CopyIcon className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md mt-4">
              <Button variant="outline" className="flex-1" size="lg" onClick={resetAndClose}>
                Terminer
              </Button>
              <a 
                href={`https://wa.me/?text=${encodeURIComponent(`Bonjour, voici votre lien de paiement sécurisé pour votre commande d'un montant de ${formatXOF(total)} : ${paymentLink}`)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className={buttonVariants({ className: "flex-1 bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-green-500/20", size: "lg" })}
              >
                <MessageCircle className="mr-2 h-5 w-5" />
                Envoyer sur WhatsApp
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}
