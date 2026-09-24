"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { formatXOF } from "@/lib/money";
import { Package, MoreVertical, Edit, Trash } from "lucide-react";
import { ProductDialog } from "@/components/products/product-dialog";
import { deleteProductAction } from "@/app/actions/product";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ProductGridProps {
  products: any[];
}

export function ProductGrid({ products }: ProductGridProps) {
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center border rounded-xl bg-muted/20 border-dashed">
        <Package className="w-12 h-12 text-muted-foreground mb-4 opacity-50" />
        <h3 className="text-lg font-semibold">Aucun produit</h3>
        <p className="text-muted-foreground mt-2 max-w-sm">
          Votre catalogue est vide. Ajoutez des produits pour commencer à générer des liens de paiement.
        </p>
      </div>
    );
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteProductAction(id);
        toast.success("Produit supprimé avec succès.");
      } catch (error) {
        toast.error("Erreur lors de la suppression.");
      }
    });
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
            <div className="aspect-square bg-muted flex items-center justify-center relative">
              {product.image_path ? (
                <img src={product.image_path} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-16 h-16 text-muted-foreground/30" />
              )}
              
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger 
                    className={`inline-flex shrink-0 items-center justify-center border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] h-8 w-8 rounded-lg bg-background/80 backdrop-blur-sm hover:bg-background`}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => {
                      setTimeout(() => setEditingProduct(product), 150);
                    }}>
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      disabled={isPending}
                      onClick={() => {
                        setTimeout(() => setDeletingProductId(product.id), 150);
                      }}
                    >
                      <Trash className="mr-2 h-4 w-4" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <CardContent className="p-4 flex-1">
              <h3 className="font-semibold text-lg line-clamp-1" title={product.name}>{product.name}</h3>
              {product.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1" title={product.description}>
                  {product.description}
                </p>
              )}
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <div className="font-bold text-primary">{formatXOF(product.price_xof)}</div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {editingProduct && (
        <ProductDialog 
          open={!!editingProduct} 
          onOpenChange={(open) => {
            if (!open) setEditingProduct(null);
          }}
          product={editingProduct} 
        />
      )}

      <AlertDialog open={!!deletingProductId} onOpenChange={(open) => {
        if (!open) setDeletingProductId(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le produit</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer ce produit ? Cette action est irréversible et supprimera le produit de votre catalogue.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deletingProductId) handleDelete(deletingProductId);
                setDeletingProductId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
