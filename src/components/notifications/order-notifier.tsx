"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/client";
import { formatXOF } from "@/lib/money";
import { isOrderSoundEnabled, playOrderSound, unlockOrderSound } from "@/lib/order-sound";

type OrderRow = {
  id: string;
  reference: string;
  total_xof: number;
  snapshot: { name?: string; source?: string } | null;
};

// Écoute les nouvelles commandes de la boutique tant que l'app est ouverte.
export function OrderNotifier({ shopId }: { shopId: string }) {
  const router = useRouter();

  useEffect(() => {
    const unlock = () => unlockOrderSound();
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" }).catch((err) => {
        console.error("Service worker registration failed:", err);
      });
    }

    // Client dédié au temps réel :
    // - worker: le battement de cœur tourne dans un Web Worker, sinon Chrome le ralentit
    //   quand l'onglet est en arrière-plan et la connexion tombe sans prévenir ;
    // - accessToken: la souscription se fait avec la session de l'utilisateur (RLS).
    const session = createClient();
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        accessToken: async () => (await session.auth.getSession()).data.session?.access_token ?? null,
        realtime: { worker: true },
      }
    );

    const seen = new Set<string>();
    const channel = supabase
      .channel(`orders:${shopId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders", filter: `shop_id=eq.${shopId}` },
        (payload) => {
          const order = payload.new as OrderRow;
          if (order.snapshot?.source !== "boutique" || seen.has(order.id)) return;
          seen.add(order.id);

          if (isOrderSoundEnabled()) playOrderSound();
          toast.success(`Nouvelle commande ${order.reference}`, {
            description: `${order.snapshot?.name || "Un client"} · ${formatXOF(order.total_xof)}`,
            duration: 10000,
            action: { label: "Voir", onClick: () => router.push("/commandes") },
          });
          router.refresh();
        }
      )
      .subscribe((status, err) => {
        if (status !== "SUBSCRIBED") console.warn("Realtime commandes :", status, err?.message ?? "");
      });

    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
      void supabase.removeChannel(channel);
    };
  }, [shopId, router]);

  return null;
}
