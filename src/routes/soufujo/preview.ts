import type { PreviewItem } from "$lib/components";
import type { PlainDate, TemplateProps } from "$lib/templates/soufujo";

// View-model for the share-import confirmation dialog: condenses a decoded
// payload into the summary rows ImportDialog renders. Kept out of the page
// component (mirroring `filename.ts`) so it stays declarative and testable.

function formatDate(d: PlainDate): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.year}-${pad(d.month)}-${pad(d.day)}`;
}

export function buildSoufujoPreviewItems(p: TemplateProps): PreviewItem[] {
  const recipient =
    [p.宛先.会社名, p.宛先.部署, p.宛先.氏名]
      .map((s) => s.trim())
      .filter(Boolean)
      .join(" ") || "（未設定）";
  return [
    { label: "件名", value: p.件名 || "（未設定）", format: "break-all" },
    {
      label: "日付",
      value: p.日付 === "auto" ? "自動（発行時）" : formatDate(p.日付),
      format: "tabular",
    },
    { label: "宛先", value: recipient, format: "break-all" },
    {
      label: "差出人",
      value: p.差出人.氏名 || p.差出人.会社名 || "（未設定）",
      format: "break-all",
    },
    { label: "同封物", value: `${p.同封物.length} 件` },
  ];
}
