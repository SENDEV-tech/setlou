import { AppSidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { getCurrentProfile } from "@/server/data/supabase-store";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") || "";

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
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </SidebarInset>
      <MobileNav profile={profile} />
    </SidebarProvider>
  );
}
