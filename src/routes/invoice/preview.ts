import type { PreviewItem } from "$lib/components";
import type { PlainDate, TemplateProps } from "$lib/templates/invoice";

// View-model for the share-import confirmation dialog: condenses a decoded
// payload into the summary rows ImportDialog renders. Kept out of the page
// component (mirroring `filename.ts`) so it stays declarative and testable.

function formatDate(d: PlainDate): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.year}-${pad(d.month)}-${pad(d.day)}`;
}

export function buildInvoicePreviewItems(p: TemplateProps): PreviewItem[] {
  return [
    { label: "タイトル", value: p.title || "（未設定）", format: "break-all" },
    {
      label: "発行日",
      value: p.date === "auto" ? "自動（発行時）" : formatDate(p.date),
      format: "tabular",
    },
    { label: "支払期限", value: formatDate(p["due-date"]), format: "tabular" },
    {
      label: "請求先",
      value: p.recipient.name || "（未設定）",
      format: "break-all",
    },
    {
      label: "請求元",
      value: p.issuer.name || "（未設定）",
      format: "break-all",
    },
    { label: "項目", value: `${p.items.length} 件` },
  ];
}
