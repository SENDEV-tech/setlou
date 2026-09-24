"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BarChart3, PackageOpen, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProfileStatsDialogProps {
  profile: any;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ProfileStatsDialog({ profile, open, onOpenChange }: ProfileStatsDialogProps) {
  const stats = profile?.stats || { total: 0, pending: 0, paid: 0, cancelled: 0 };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Statistiques de {profile?.full_name}
          </DialogTitle>
          <DialogDescription>
            Aperçu des performances et du nombre de commandes générées par ce collaborateur.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="flex flex-col items-center justify-center p-4 bg-muted/30 rounded-xl border">
            <PackageOpen className="w-8 h-8 text-blue-500 mb-2" />
            <span className="text-2xl font-bold">{stats.total}</span>
            <span className="text-xs text-muted-foreground uppercase font-semibold tracking-wider mt-1">Total</span>
          </div>
          
          <div className="flex flex-col items-center justify-center p-4 bg-green-500/10 rounded-xl border border-green-500/20">
            <CheckCircle2 className="w-8 h-8 text-green-500 mb-2" />
            <span className="text-2xl font-bold text-green-600">{stats.paid}</span>
            <span className="text-xs text-green-600/70 uppercase font-semibold tracking-wider mt-1">Payées</span>
          </div>

          <div className="flex flex-col items-center justify-center p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
            <Clock className="w-8 h-8 text-orange-500 mb-2" />
            <span className="text-2xl font-bold text-orange-600">{stats.pending}</span>
            <span className="text-xs text-orange-600/70 uppercase font-semibold tracking-wider mt-1">En attente</span>
          </div>

          <div className="flex flex-col items-center justify-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
            <XCircle className="w-8 h-8 text-red-500 mb-2" />
            <span className="text-2xl font-bold text-red-600">{stats.cancelled}</span>
            <span className="text-xs text-red-600/70 uppercase font-semibold tracking-wider mt-1">Annulées</span>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
