import type { MetadataRoute } from "next";

// Permet d'installer Setlou sur l'écran d'accueil (nécessaire pour le push sur iPhone).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Setlou",
    short_name: "Setlou",
    description: "Vendez sur WhatsApp. Encaissez en toute sécurité.",
    start_url: "/commandes",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#16a34a",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
