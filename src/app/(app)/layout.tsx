import { AppSidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { getCurrentProfile, getCurrentShopId, getShop } from "@/server/data/supabase-store";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { logoutAction } from "@/app/actions/auth";
import { LogOut } from "lucide-react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  const shopId = await getCurrentShopId();
  const shop = await getShop(shopId);

  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") || "";

  // Subscription Enforcement for owners
  if (profile.role === "owner") {
    const status = shop.subscription_status;
    if (status !== "active" && status !== "trialing") {
      redirect("/abonnement");
    }
  }

  // RBAC: assistants can only access /commandes and /produits
  if (profile.role === "assistant") {
    if (
      pathname.startsWith("/tableau-de-bord") ||
      pathname.startsWith("/profils") ||
      pathname.startsWith("/parametres")
    ) {
      redirect("/commandes");
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar profile={profile} />
      <SidebarInset className="pb-16 md:pb-0 bg-muted/20">
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
          <SidebarTrigger variant="ghost" className="p-0 hover:bg-transparent -ml-2">
            <div className="flex items-center gap-2 font-semibold text-primary">
              <div className="h-6 w-6 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
                S
              </div>
              <span className="text-base">Setlou</span>
            </div>
          </SidebarTrigger>
          <form action={logoutAction}>
            <button type="submit" className="flex items-center justify-center p-2 text-muted-foreground hover:text-red-500 transition-colors">
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Se déconnecter</span>
            </button>
          </form>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
      <MobileNav profile={profile} />
    </SidebarProvider>
  );
}
