import type { ResumeData } from "./types";

// Characters that are unsafe in filenames on at least one major OS, plus
// control characters. Replaced with underscore so the downloaded PDF doesn't
// break on Windows/Safari's sanitizer.
const UNSAFE = /[\x00-\x1f/\\:*?"<>|]/g;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function formatYmd(y: number, m: number, d: number): string {
  return `${y}${pad(m)}${pad(d)}`;
}

function sanitizeName(raw: string): string {
  return raw.replace(UNSAFE, "_").trim();
}

// Today's date in the user's local timezone. `now` is injectable for tests.
function todayYmd(now: Date): string {
  return formatYmd(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// `resume_{氏名}_{YYYYMMDD}.pdf`, or `resume_{YYYYMMDD}.pdf` when 氏名 empty.
// The date is:
//  - `data.日付` when specified explicitly
//  - today (per `now`) when `data.日付 === 'auto'`
export function buildResumeFilename(
  data: ResumeData,
  now: Date = new Date(),
): string {
  const name = sanitizeName(`${data.氏名.姓}${data.氏名.名}`);
  const date =
    data.日付 === "auto"
      ? todayYmd(now)
      : formatYmd(data.日付.year, data.日付.month, data.日付.day);
  return name ? `resume_${name}_${date}.pdf` : `resume_${date}.pdf`;
}
