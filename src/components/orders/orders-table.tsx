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

interface OrdersTableProps {
  orders: any[];
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-500 hover:bg-green-600">Payé</Badge>;
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

  return (
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-medium">{order.reference}</TableCell>
              <TableCell>
                {order.customer?.full_name || order.snapshot?.name}
                <div className="text-xs text-muted-foreground">{order.customer?.phone || order.snapshot?.phone}</div>
              </TableCell>
              <TableCell>{new Date(order.created_at).toLocaleString("fr-SN")}</TableCell>
              <TableCell>{getStatusBadge(order.status)}</TableCell>
              <TableCell>{order.creator?.full_name}</TableCell>
              <TableCell className="text-right font-medium">{formatXOF(order.total_xof)}</TableCell>
            </TableRow>
          ))}
          {orders.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                Aucune commande trouvée.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
