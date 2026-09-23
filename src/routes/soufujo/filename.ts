import type { TemplateProps } from "$lib/templates/soufujo";

const pad = (n: number) => String(n).padStart(2, "0");

export function buildSoufujoFilename(
  data: TemplateProps,
  now: Date = new Date(),
): string {
  const d =
    data.日付 === "auto"
      ? now
      : new Date(data.日付.year, data.日付.month - 1, data.日付.day);
  const stamp = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
  return `soufujo_${stamp}.pdf`;
}
