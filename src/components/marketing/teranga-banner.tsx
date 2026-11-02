"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** Fin de l'offre Teranga : inscriptions jusqu'au 15 novembre 2026 inclus (heure de Dakar, UTC+0). */
const OFFER_END = Date.UTC(2026, 10, 16);

const subscribeNoop = () => () => {};
const isOfferRunning = () => Date.now() < OFFER_END;

/**
 * Bandeau temporaire de l'offre Teranga (1er mois à moitié prix).
 * Composant client : la page d'accueil est statique, la date est donc vérifiée dans le navigateur
 * pour que le bandeau disparaisse tout seul après le 15 novembre, sans redéploiement.
 */
export function TerangaBanner() {
  const visible = useSyncExternalStore(subscribeNoop, isOfferRunning, () => true);

  if (!visible) return null;

  return (
    <Link
      href="/signup?ref=banniere"
      className="group relative block bg-[#00853f] px-4 py-2.5 text-center text-sm font-semibold text-white"
    >
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 flex h-1"
      >
        <span className="flex-1 bg-[#00853f]" />
        <span className="flex-1 bg-[#fdef42]" />
        <span className="flex-1 bg-[#e31b23]" />
      </span>
      <span className="font-black text-[#fdef42]">Offre Teranga</span>
      <span className="mx-1.5 opacity-60">·</span>
      Gratuit à vie + 1<sup>er</sup> mois Starter à moitié prix pour toute inscription avant le 15 novembre
      <ArrowRight className="ml-1 inline h-4 w-4 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}
