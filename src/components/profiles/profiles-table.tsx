"use client";

import { useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Edit, Trash, Shield, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProfileDialog } from "@/components/profiles/profile-dialog";
import { ProfileStatsDialog } from "@/components/profiles/profile-stats-dialog";
import { deleteProfileAction } from "@/app/actions/profile";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

interface ProfilesTableProps {
  profiles: any[];
}

export function ProfilesTable({ profiles }: ProfilesTableProps) {
  const [editingProfile, setEditingProfile] = useState<any>(null);
  const [statsProfile, setStatsProfile] = useState<any>(null);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteProfileAction(id);
        toast.success("Collaborateur supprimé avec succès.");
      } catch (error: any) {
        toast.error(error.message || "Erreur lors de la suppression.");
      }
    });
  };

  return (
    <>
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Collaborateur</TableHead>
              <TableHead>Rôle</TableHead>
              <TableHead>Identifiant</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {profiles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  Aucun collaborateur trouvé.
                </TableCell>
              </TableRow>
            ) : (
              profiles.map((profile) => (
                <TableRow 
                  key={profile.id} 
                  onDoubleClick={() => setStatsProfile(profile)}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  title="Double-cliquez pour voir les statistiques"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {profile.full_name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{profile.full_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {profile.role === 'owner' ? (
                        <Shield className="w-4 h-4 text-primary" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span>{profile.role === 'owner' ? 'Admin' : 'Assistant'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">
                    {profile.username}
                  </TableCell>
                  <TableCell>{profile.whatsapp_number}</TableCell>
                  <TableCell>
                    <Badge variant={profile.is_active ? "default" : "secondary"} className={profile.is_active ? "bg-green-500/10 text-green-700 hover:bg-green-500/20 dark:bg-green-500/20 dark:text-green-400 border-green-200" : ""}>
                      {profile.is_active ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger 
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-muted hover:text-foreground h-8 w-8 p-0"
                      >
                        <span className="sr-only">Ouvrir le menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setTimeout(() => setEditingProfile(profile), 150);
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                          disabled={isPending}
                          onClick={() => {
                            setTimeout(() => setDeletingProfileId(profile.id), 150);
                          }}
                        >
                          <Trash className="mr-2 h-4 w-4" />
                          Révoquer l'accès
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {editingProfile && (
        <ProfileDialog 
          open={!!editingProfile} 
          onOpenChange={(open) => {
            if (!open) setEditingProfile(null);
          }}
          profile={editingProfile} 
        />
      )}

      {statsProfile && (
        <ProfileStatsDialog
          profile={statsProfile}
          open={!!statsProfile}
          onOpenChange={(open) => {
            if (!open) setStatsProfile(null);
          }}
        />
      )}

      <AlertDialog open={!!deletingProfileId} onOpenChange={(open) => {
        if (!open) setDeletingProfileId(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Révoquer l'accès</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment révoquer l'accès de ce collaborateur ? Cette action est irréversible et lui retirera immédiatement l'accès à la plateforme.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (deletingProfileId) handleDelete(deletingProfileId);
                setDeletingProfileId(null);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Révoquer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
