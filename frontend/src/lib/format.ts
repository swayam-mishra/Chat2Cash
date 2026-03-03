// ─── Formatting Utilities ─────────────────────────────────
// Convert raw backend values (numbers, ISO dates) into the
// display strings the UI components expect.

const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** Format a number as ₹X,XX,XXX */
export function formatINR(amount: number | null | undefined): string {
  if (amount == null) return "₹0";
  return INR.format(amount);
}

/** Format an ISO timestamp to "2 Mar, 11:42 AM" style. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  }) + ", " + d.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

/** Format ISO to "2 Mar 2026" (date only). */
export function formatDateOnly(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Map backend status strings to the display statuses used in the UI. */
export function mapStatus(
  backendStatus: string,
): "Paid" | "Pending" | "Processing" | "Draft" | "Failed" {
  switch (backendStatus.toLowerCase()) {
    case "confirmed":
    case "fulfilled":
    case "paid":
      return "Paid";
    case "pending":
      return "Pending";
    case "processing":
      return "Processing";
    case "draft":
      return "Draft";
    case "cancelled":
    case "failed":
      return "Failed";
    default:
      return "Pending";
  }
}

/** Build an items summary string like "2kg Aaloo, 1kg Pyaaz". */
export function summarizeItems(
  items: { product_name: string; quantity: number; price?: number | null }[],
): string {
  return items
    .map((i) => `${i.quantity} ${i.product_name}`)
    .join(", ");
}
