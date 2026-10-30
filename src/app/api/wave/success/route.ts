import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { applySubscriptionPayment, findCheckoutByReference, getAppOrigin } from "@/server/data/wave";

export const dynamic = "force-dynamic";

// Retour depuis Wave : on vérifie la session sans attendre le webhook.
export async function GET(req: Request) {
  const origin = await getAppOrigin();
  const ref = new URL(req.url).searchParams.get("ref");
  if (!ref || ref.length > 255) return NextResponse.redirect(`${origin}/abonnement`, 303);

  try {
    const session = await findCheckoutByReference(ref);
    if (session && (await applySubscriptionPayment(session))) {
      revalidatePath("/", "layout");
      return NextResponse.redirect(`${origin}/tableau-de-bord`, 303);
    }
  } catch (error) {
    console.error("Wave success error:", error);
  }
  return NextResponse.redirect(`${origin}/abonnement?wave=attente`, 303);
}
