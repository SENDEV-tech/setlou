import { NextResponse } from "next/server";
import { confirmOrderCheckout } from "@/server/data/shop-wave";
import { getAppOrigin } from "@/server/data/wave";

export const dynamic = "force-dynamic";

// Retour du client depuis Wave après le paiement d'une commande :
// on vérifie la session auprès de Wave (clé du vendeur) sans attendre le webhook.
export async function GET(req: Request, props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;
  const origin = await getAppOrigin();
  const payUrl = `${origin}/pay/${encodeURIComponent(token)}`;
  const ref = new URL(req.url).searchParams.get("ref");
  if (!ref || ref.length > 255) return NextResponse.redirect(payUrl, 303);

  try {
    if (await confirmOrderCheckout(token, ref)) return NextResponse.redirect(payUrl, 303);
  } catch (error) {
    console.error("Wave retour commande :", error);
  }
  return NextResponse.redirect(`${payUrl}?wave=attente`, 303);
}
