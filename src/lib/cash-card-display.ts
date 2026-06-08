/** Plain text for UI — API descriptions often arrive as minimal HTML (`<p>…</p>`, `&nbsp;`). */
export function htmlToPlainText(html: string): string {
  if (!html) return "";
  return html
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const PRODUCT_TYPE_LABELS: Record<string, string> = {
  CASH_CARD: "Gift Card",
};

export function cashCardCategoryLabel(productType: string | undefined | null): string {
  if (productType == null || productType === "") {
    return "Shop";
  }
  return (
    PRODUCT_TYPE_LABELS[productType] ??
    productType.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase())
  );
}

export function cashCardStatusLabel(status: string | undefined | null): string {
  if (status == null || status === "") {
    return "—";
  }
  return status.replace(/_/g, " ").replace(/\b\w/g, (ch) => ch.toUpperCase());
}
