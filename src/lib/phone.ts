// Numéros acceptés pour la connexion par SMS. Sénégal uniquement pour
// l'instant : limiter les pays évite la fraude aux SMS vers l'étranger.
export const SMS_COUNTRY_CODE = "221";

/**
 * Transforme ce que tape le vendeur ("77 123 45 67", "+221771234567",
 * "00221 77...") en numéro international "+221771234567".
 * Retourne null si ce n'est pas un numéro mobile sénégalais.
 */
export function normalizeSenegalPhone(input: string): string | null {
  let digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) digits = digits.slice(1);
  else if (digits.startsWith("00")) digits = digits.slice(2);

  if (digits.length === 12 && digits.startsWith(SMS_COUNTRY_CODE)) {
    digits = digits.slice(SMS_COUNTRY_CODE.length);
  }

  // Mobiles : 9 chiffres commençant par 7 (70, 75, 76, 77, 78...).
  if (!/^7\d{8}$/.test(digits)) return null;
  return `+${SMS_COUNTRY_CODE}${digits}`;
}

/** "+221771234567" -> "+221 77 123 45 67" */
export function formatSenegalPhone(phone: string): string {
  const m = phone.match(/^\+221(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return m ? `+221 ${m[1]} ${m[2]} ${m[3]} ${m[4]}` : phone;
}
