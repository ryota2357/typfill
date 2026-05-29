import type { PreviewItem } from "$lib/components";
import type { Contact, PlainDate, TemplateProps } from "$lib/templates/resume";

// View-model for the share-import confirmation dialog: condenses a decoded
// payload into the summary rows ImportDialog renders. Kept out of the page
// component (mirroring `filename.ts`) so it stays declarative and testable.

function truncate(s: string, max: number): string {
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

function formatDate(d: PlainDate): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.year}-${pad(d.month)}-${pad(d.day)}`;
}

function addressPreview(c: Contact): string {
  const postal = c.郵便番号.trim();
  const addr = c.住所.trim();
  if (!postal && !addr) return "（未設定）";
  const postalPart = postal ? `〒${postal}` : "";
  const addrPart = addr ? truncate(addr, 30) : "";
  return [postalPart, addrPart].filter(Boolean).join(" ");
}

export function buildResumePreviewItems(p: TemplateProps): PreviewItem[] {
  const fullName = (p.氏名.姓 + p.氏名.名).trim() || "（未設定）";
  return [
    { label: "氏名", value: fullName, format: "break-all" },
    { label: "生年月日", value: formatDate(p.生年月日), format: "tabular" },
    { label: "現住所", value: addressPreview(p.現住所), format: "break-all" },
    { label: "連絡先", value: addressPreview(p.連絡先), format: "break-all" },
    { label: "学歴", value: `${p.学歴.length} 件` },
    { label: "職歴", value: `${p.職歴.length} 件` },
    { label: "免許・資格", value: `${p["免許・資格"].length} 件` },
    { label: "志望動機", value: `${p.志望動機.length} 文字` },
    { label: "本人希望記入欄", value: `${p.本人希望記入欄.length} 文字` },
    { label: "写真", value: p.写真 ? "あり" : "なし" },
  ];
}
