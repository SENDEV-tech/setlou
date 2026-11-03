import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { ResetPasswordForm } from "./reset-password-form";

export const metadata: Metadata = {
  title: "Nouveau mot de passe · Setlou",
};

export default async function ResetPasswordPage() {
  // La session est ouverte par /auth/callback quand on clique le lien reçu par email.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/mot-de-passe-oublie?expire=1");
  }

  return <ResetPasswordForm email={user.email ?? null} />;
}
