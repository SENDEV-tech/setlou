export const SHOP_STYLES = ["moderne", "elegant", "colore"] as const;
export type ShopStyle = (typeof SHOP_STYLES)[number];

export const SHOP_STYLE_LABELS: Record<ShopStyle, { label: string; hint: string }> = {
  moderne: { label: "Moderne", hint: "Épuré et doux" },
  elegant: { label: "Élégant", hint: "Chic, sombre, typo fine" },
  colore: { label: "Coloré", hint: "Vif et joyeux" },
};

export function toShopStyle(value: string | null | undefined): ShopStyle {
  return SHOP_STYLES.includes(value as ShopStyle) ? (value as ShopStyle) : "moderne";
}

// Couleurs de repli : une boutique sans couleur choisie reçoit quand même la sienne.
const FALLBACK_COLORS = ["#16a34a", "#2563eb", "#db2777", "#ea580c", "#7c3aed", "#0d9488", "#dc2626", "#ca8a04"];

export function shopColor(brandColor: string | null | undefined, slug: string): string {
  if (brandColor && /^#[0-9a-f]{6}$/i.test(brandColor)) return brandColor;
  let hash = 0;
  for (const char of slug) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}
