import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/server/data/supabase-store";
import { createSubscriptionCheckout, getAppOrigin, isWavePlan } from "@/server/data/wave";

export const dynamic = "force-dynamic";

// Formulaire de /abonnement : crée une session Wave pour le plan choisi
// et envoie le propriétaire vers Wave.
export async function POST(req: Request) {
  const origin = await getAppOrigin();
  const plan = (await req.formData()).get("plan");
  if (!isWavePlan(plan)) {
    return NextResponse.json({ error: "Plan invalide" }, { status: 400 });
  }

  let shopId: string;
  try {
    const profile = await getCurrentProfile();
    if (profile.role !== "owner") return NextResponse.redirect(`${origin}/commandes`, 303);
    shopId = profile.shop_id as string;
  } catch {
    return NextResponse.redirect(`${origin}/login`, 303);
  }

  try {
    const launchUrl = await createSubscriptionCheckout(shopId, plan);
    return NextResponse.redirect(launchUrl, 303);
  } catch (error) {
    console.error("Wave Checkout Error:", error);
    return NextResponse.redirect(`${origin}/abonnement?wave=erreur`, 303);
  }
}
