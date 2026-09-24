import { getOrders, getProducts, updateOrderStatus } from "@/server/data/supabase-store";
import { OrdersTable } from "@/components/orders/orders-table";
import { CreateOrderDialog } from "@/components/orders/create-order-dialog";


export default async function OrdersPage(props: { searchParams: Promise<{ status?: string }> }) {
  const searchParams = await props.searchParams;
  const status = typeof searchParams.status === "string" ? searchParams.status : undefined;
  
  const orders = await getOrders(status as any);
  const products = await getProducts();

  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2 flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Commandes</h2>
          <p className="text-muted-foreground">
            Gérez vos commandes et générez des liens de paiement.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <CreateOrderDialog products={products} />
        </div>
      </div>
      
      <div className="space-y-4">
        <OrdersTable orders={orders} />
      </div>
    </div>
  );
}
