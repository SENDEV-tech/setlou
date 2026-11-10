"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export default function EmailConfirmedPage() {
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    async function handleSessionFromUrl() {
      const supabase = createClient();

      // Si Supabase a redirigé avec #access_token=...&refresh_token=... dans le hash
      if (window.location.hash && window.location.hash.includes("access_token=")) {
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const access_token = hashParams.get("access_token");
        const refresh_token = hashParams.get("refresh_token");

        if (access_token && refresh_token) {
          await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          // Nettoyer le hash de l'URL sans recharger la page
          window.history.replaceState(null, "", window.location.pathname);
        }
      }

      setVerifying(false);
    }

    handleSessionFromUrl();
  }, []);

  return (
    <div className="flex flex-col items-center space-y-6 text-center sm:w-[350px] mx-auto">
      <div className="h-16 w-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center">
        {verifying ? (
          <Loader2 className="h-8 w-8 animate-spin" />
        ) : (
          <CheckCircle2 className="h-8 w-8" />
        )}
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Email confirmé !
        </h1>
        <p className="text-sm text-muted-foreground">
          Votre adresse email a bien été vérifiée. Votre boutique Setlou est prête à accueillir vos premières ventes.
        </p>
      </div>

      <div className="w-full pt-2">
        <Button
          className="w-full gap-2"
          size="lg"
          disabled={verifying}
          onClick={() => router.push("/tableau-de-bord")}
        >
          Accéder au tableau de bord
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Si vous n&apos;êtes pas redirigé automatiquement,{" "}
        <Link href="/tableau-de-bord" className="underline hover:text-primary">
          cliquez ici
        </Link>
        .
      </p>
    </div>
  );
}
