"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Package, Users, Settings, HelpCircle } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Tableau de bord", href: "/tableau-de-bord", icon: LayoutDashboard },
  { title: "Commandes", href: "/commandes", icon: ShoppingBag },
  { title: "Produits", href: "/produits", icon: Package },
  { title: "Profils", href: "/profils", icon: Users },
  { title: "Paramètres", href: "/parametres", icon: Settings },
];

import { logoutAction } from "@/app/actions/auth";
import { LogOut } from "lucide-react";

export function AppSidebar({ profile }: { profile: any }) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter((item) => {
    if (profile.role === "assistant") {
      return item.href === "/commandes" || item.href === "/produits";
    }
    return true;
  });

  return (
    <Sidebar className="border-r hidden md:flex">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2 font-semibold text-lg text-primary">
          <div className="h-8 w-8 rounded bg-primary text-primary-foreground flex items-center justify-center font-bold">
            S
          </div>
          Setlou
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {filteredNavItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                render={<Link href={item.href} />}
                isActive={pathname === item.href || pathname.startsWith(item.href + "/")}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t flex flex-col gap-2">
        <SidebarMenuButton 
          render={<Link href="/support" />}
          isActive={pathname === "/support"}
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <HelpCircle className="h-4 w-4" />
          <span>Aide et Support</span>
        </SidebarMenuButton>
        <form action={logoutAction} className="w-full mt-2">
          <SidebarMenuButton type="submit" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
            <LogOut className="h-4 w-4" />
            <span>Se déconnecter</span>
          </SidebarMenuButton>
        </form>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm font-medium uppercase shrink-0">
            {profile.full_name?.substring(0, 2) || "U"}
          </div>
          <div className="flex flex-col text-sm overflow-hidden">
            <span className="font-medium truncate">{profile.full_name}</span>
            <span className="text-xs text-muted-foreground capitalize">{profile.role === "owner" ? "Propriétaire" : "Assistant"}</span>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
