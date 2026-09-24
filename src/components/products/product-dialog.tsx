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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, Package, Image as ImageIcon, Edit } from "lucide-react";
import { createProductAction, updateProductAction } from "@/app/actions/product";
import { toast } from "sonner";

interface ProductDialogProps {
  product?: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

export function ProductDialog({ product, open: controlledOpen, onOpenChange, trigger }: ProductDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  
  const [loading, setLoading] = React.useState(false);
  const [imagePreview, setImagePreview] = React.useState<string | null>(product?.image_path || null);

  const isEdit = !!product;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("L'image ne doit pas dépasser 2Mo");
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImagePreview(product?.image_path || null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      
      const result = isEdit 
        ? await updateProductAction(product.id, formData)
        : await createProductAction(formData);
      
      if (result.success) {
        toast.success(isEdit ? "Produit modifié avec succès !" : "Produit ajouté avec succès !");
        setOpen(false);
      }
    } catch (error) {
      toast.error(isEdit ? "Erreur lors de la modification." : "Erreur lors de l'ajout.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isEdit && (
        <Button className="shadow-lg" onClick={() => setOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Ajouter un produit
        </Button>
      )}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {isEdit ? "Modifier le Produit" : "Nouveau Produit"}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? "Modifiez les informations de cet article." : "Ajoutez un nouvel article à votre catalogue avec une photo."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2" autoComplete="off">
          
          <div className="flex flex-col items-center justify-center gap-4">
            <div 
              className="w-32 h-32 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden bg-muted relative group cursor-pointer"
              onClick={() => document.getElementById("image")?.click()}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-xs">Ajouter photo</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Edit className="w-6 h-6" />
              </div>
            </div>
            <Input 
              id="image" 
              name="image" 
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleImageChange}
            />
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">Nom du produit</label>
              <Input id="name" name="name" defaultValue={product?.name} placeholder="Ex: Casquette Setlou" required />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="price" className="text-sm font-medium">Prix (en XOF)</label>
              <Input id="price" name="price" type="number" min="0" defaultValue={product?.price_xof} placeholder="Ex: 5000" required />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description (optionnel)</label>
              <Textarea 
                id="description" 
                name="description" 
                defaultValue={product?.description}
                placeholder="Ex: Casquette ajustable 100% coton..." 
                rows={3}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
    </>
  );
}
