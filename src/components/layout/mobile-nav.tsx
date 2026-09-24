"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Package, Settings, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Accueil", href: "/tableau-de-bord", icon: LayoutDashboard },
  { title: "Commandes", href: "/commandes", icon: ShoppingBag },
];

const navItemsRight = [
  { title: "Produits", href: "/produits", icon: Package },
  { title: "Paramètres", href: "/parametres", icon: Settings },
];

export function MobileNav({ profile }: { profile: any }) {
  const pathname = usePathname();

  const filteredNavItems = navItems.filter((item) => {
    if (profile?.role === "assistant") {
      return item.href === "/commandes" || item.href === "/produits";
    }
    return true;
  });

  const filteredNavItemsRight = navItemsRight.filter((item) => {
    if (profile?.role === "assistant") {
      return item.href === "/commandes" || item.href === "/produits";
    }
    return true;
  });

  return (
    <div className="md:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border flex items-center justify-around px-2 pb-safe">
      {filteredNavItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full text-muted-foreground transition-colors",
              isActive && "text-primary font-medium"
            )}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span className="text-[10px]">{item.title}</span>
          </Link>
        );
      })}


      {filteredNavItemsRight.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center w-full h-full text-muted-foreground transition-colors",
              isActive && "text-primary font-medium"
            )}
          >
            <item.icon className="h-5 w-5 mb-1" />
            <span className="text-[10px]">{item.title}</span>
          </Link>
        );
      })}
    </div>
  );
}
