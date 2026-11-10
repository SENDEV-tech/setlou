"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Enregistre une visite à chaque changement de page.
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Si Supabase redirige vers n'importe quelle page (autre que /confirmed) avec un token dans le hash
    if (
      pathname !== "/confirmed" &&
      typeof window !== "undefined" &&
      window.location.hash.includes("access_token=")
    ) {
      window.location.replace(`/confirmed${window.location.hash}`);
      return;
    }

    if (!pathname || pathname.startsWith("/admin")) return;

    const body = JSON.stringify({ path: pathname, referrer: document.referrer || null });
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
