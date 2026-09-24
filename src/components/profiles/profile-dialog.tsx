"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon, UserPlus, Edit } from "lucide-react";
import { createProfileAction, updateProfileAction } from "@/app/actions/profile";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Role } from "@/server/data/supabase-store";

interface ProfileDialogProps {
  profile?: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProfileDialog({ profile, open: controlledOpen, onOpenChange }: ProfileDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  
  const [loading, setLoading] = React.useState(false);
  const [role, setRole] = React.useState<Role>(profile?.role || "assistant");

  const isEdit = !!profile;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.currentTarget);
      formData.append("role", role);
      
      const result = isEdit 
        ? await updateProfileAction(profile.id, formData)
        : await createProfileAction(formData);
      
      if (result.success) {
        toast.success(isEdit ? "Profil modifié avec succès !" : "Assistant ajouté avec succès !");
        setOpen(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {!isEdit && (
        <Button className="shadow-lg" onClick={() => setOpen(true)}>
          <PlusIcon className="mr-2 h-4 w-4" />
          Ajouter un collaborateur
        </Button>
      )}
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isEdit ? <Edit className="w-5 h-5 text-primary" /> : <UserPlus className="w-5 h-5 text-primary" />}
              {isEdit ? "Modifier le Profil" : "Nouveau Collaborateur"}
            </DialogTitle>
            <DialogDescription>
              {isEdit ? "Modifiez les informations et les accès de ce collaborateur." : "Créez un accès pour un membre de votre équipe."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2" autoComplete="off">
            
            <div className="space-y-2">
              <label htmlFor="full_name" className="text-sm font-medium">Nom complet</label>
              <Input id="full_name" name="full_name" defaultValue={profile?.full_name} placeholder="Ex: Awa Fall" required />
            </div>

            {!isEdit && (
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium">Nom d'utilisateur (pour la connexion)</label>
                <Input id="username" name="username" defaultValue={profile?.username} placeholder="Ex: awa_ast" required />
                <p className="text-xs text-muted-foreground">Le mot de passe par défaut sera "setlou2026". Il lui sera demandé de le changer à la première connexion.</p>
              </div>
            )}
            
            <div className="space-y-2">
              <label htmlFor="whatsapp_number" className="text-sm font-medium">Numéro WhatsApp</label>
              <Input id="whatsapp_number" name="whatsapp_number" type="tel" defaultValue={profile?.whatsapp_number} placeholder="Ex: +221 77 123 45 67" required />
            </div>

            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">Rôle</label>
              <Select value={role} onValueChange={(v) => setRole(v as Role)} required>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="assistant">Assistant (Vendeur)</SelectItem>
                  <SelectItem value="owner">Propriétaire (Admin)</SelectItem>
                </SelectContent>
              </Select>
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
