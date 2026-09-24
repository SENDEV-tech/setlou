import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatXOF } from "@/lib/money";

interface RecentOrdersProps {
  orders: any[];
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  return (
    <div className="space-y-8">
      {orders.map((order) => {
        const initials = order.snapshot.name
          ? order.snapshot.name.split(" ").map((n: string) => n[0]).join("").substring(0, 2)
          : "??";
        
        return (
          <div key={order.id} className="flex items-center">
            <Avatar className="h-9 w-9">
              <AvatarFallback>{initials.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="ml-4 space-y-1">
              <p className="text-sm font-medium leading-none">{order.snapshot.name || order.snapshot.phone}</p>
              <p className="text-sm text-muted-foreground">
                {order.reference} • {new Date(order.created_at).toLocaleDateString("fr-SN")}
              </p>
            </div>
            <div className="ml-auto font-medium">
              +{formatXOF(order.total_xof)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
