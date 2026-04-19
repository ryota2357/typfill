import type { Fields } from "$lib/templates/invoice";

const pad = (n: number) => String(n).padStart(2, "0");

export function buildInvoiceFilename(data: Fields, now: Date = new Date()): string {
  const d = data.date === "auto" ? now : new Date(data.date.year, data.date.month - 1, data.date.day);
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  const series = data["invoice-number-series"];
  return `invoice_${stamp}_${series}.pdf`;
}
