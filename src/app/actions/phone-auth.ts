"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/utils/supabase/server";
import { normalizeSenegalPhone } from "@/lib/phone";
import { checkSmsLimit } from "@/server/data/sms-limit";
import { createOwnerShop, hasOwnerProfile } from "@/server/data/owner-signup";

type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

const phoneField = z
  .string()
  .transform((v, ctx) => {
    const phone = normalizeSenegalPhone(v);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "Numéro invalide. Exemple : 77 123 45 67" });
      return z.NEVER;
    }
    return phone;
  });

const signupFields = {
  shopName: z.string().trim().min(2, "Nom de boutique trop court"),
  fullName: z.string().trim().min(2, "Nom trop court"),
};

const sendCodeSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("signup"), phone: phoneField, ...signupFields }),
  z.object({ mode: z.literal("login"), phone: phoneField }),
]);

const verifySchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("signup"),
    phone: phoneField,
    code: z.string().regex(/^\d{6}$/, "Le code contient 6 chiffres"),
    ...signupFields,
  }),
  z.object({
    mode: z.literal("login"),
    phone: phoneField,
    code: z.string().regex(/^\d{6}$/, "Le code contient 6 chiffres"),
  }),
]);

function fieldErrorsOf(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

function smsErrorMessage(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("signups not allowed") || m.includes("user not found")) {
    return "Aucun compte avec ce numéro. Créez d'abord votre boutique.";
  }
  if (m.includes("rate limit") || m.includes("security purposes") || m.includes("seconds")) {
    return "Trop de demandes. Patientez une minute avant de redemander un code.";
  }
  if (m.includes("provider") || m.includes("phone")) {
    return "L'envoi de SMS n'est pas disponible pour le moment. Utilisez l'email.";
  }
  return "Impossible d'envoyer le code. Réessayez.";
}

/** Étape 1 : envoie un code à 6 chiffres par SMS. */
export async function sendPhoneCodeAction(
  formData: FormData
): Promise<ActionResult<{ phone: string }>> {
  const parsed = sendCodeSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors = fieldErrorsOf(parsed.error);
    return { ok: false, error: Object.values(fieldErrors)[0], fieldErrors };
  }
  const { mode, phone } = parsed.data;

  const ip = ((await headers()).get("x-forwarded-for") || "").split(",")[0].trim();
  const { allowed } = await checkSmsLimit(phone, ip);
  if (!allowed) {
    return { ok: false, error: "Trop de codes demandés. Réessayez dans une heure." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    phone,
    options: {
      // La connexion n'invente pas de compte ; l'inscription peut le créer.
      shouldCreateUser: mode === "signup",
      data: mode === "signup" ? { full_name: parsed.data.fullName } : undefined,
    },
  });

  if (error) {
    console.error("sendPhoneCodeAction:", error.message);
    return { ok: false, error: smsErrorMessage(error.message) };
  }

  return { ok: true, data: { phone } };
}

/**
 * Étape 2 : vérifie le code, ouvre la session, et à l'inscription crée la
 * boutique. Un numéro qui a déjà une boutique est simplement connecté.
 */
export async function verifyPhoneCodeAction(
  formData: FormData
): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = verifySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    const fieldErrors = fieldErrorsOf(parsed.error);
    return { ok: false, error: Object.values(fieldErrors)[0], fieldErrors };
  }
  const input = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.verifyOtp({
    phone: input.phone,
    token: input.code,
    type: "sms",
  });

  if (error || !data.user) {
    return {
      ok: false,
      error: "Code incorrect ou expiré.",
      fieldErrors: { code: "Code incorrect ou expiré." },
    };
  }

  const userId = data.user.id;
  if (!(await hasOwnerProfile(userId))) {
    if (input.mode === "login") {
      await supabase.auth.signOut();
      return { ok: false, error: "Aucune boutique avec ce numéro. Créez d'abord votre boutique." };
    }

    const created = await createOwnerShop({
      userId,
      shopName: input.shopName,
      fullName: input.fullName,
      // Le numéro vérifié sert aussi de WhatsApp de la boutique (modifiable ensuite).
      whatsapp: input.phone,
      username: input.phone.slice(1),
    });
    if (!created.ok) {
      await supabase.auth.signOut();
      return { ok: false, error: created.error };
    }
  }

  revalidatePath("/", "layout");
  return { ok: true, data: { redirectTo: "/tableau-de-bord" } };
}
