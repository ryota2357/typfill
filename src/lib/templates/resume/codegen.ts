import { plainMarkupLit, rawMarkupLit, stringLit } from "$lib/typst/escape";
import type { Contact, Fields, TimelineEntry } from "./schema";

// Local helper types for codegen-only shapes (not worth a public alias).
type DateObj = Extract<Fields["生年月日"], { year: number }>;
type Name = Fields["氏名"];

// Typst length literals (e.g. "22em", "10mm"). Validated at codegen time.
type TypstLength = string;

// Accepts Typst length literals like `22em`, `10mm`, `1.5pt`, `80%`. Rejects
// anything else to prevent arbitrary code injection through length fields.
const LENGTH_PATTERN = /^\d+(?:\.\d+)?(em|pt|mm|cm|in|%)$/;

function lengthLit(value: TypstLength): string {
  if (!LENGTH_PATTERN.test(value)) {
    throw new Error(`Invalid Typst length literal: ${JSON.stringify(value)}`);
  }
  return value;
}

function datetimeLit(d: DateObj): string {
  return `datetime(year: ${d.year}, month: ${d.month}, day: ${d.day})`;
}

function nameTupleLit(name: Name): string {
  return `(${plainMarkupLit(name.姓)}, ${plainMarkupLit(name.名)})`;
}

function contactLit(c: Contact, indent: string): string {
  const lines = [
    `${indent}  郵便番号: ${plainMarkupLit(c.郵便番号)}`,
    `${indent}  住所: ${plainMarkupLit(c.住所)}`,
    `${indent}  住所ふりがな: ${plainMarkupLit(c.住所ふりがな)}`,
    `${indent}  電話: ${plainMarkupLit(c.電話)}`,
    `${indent}  E-mail: ${plainMarkupLit(c["E-mail"])}`,
  ];
  return `(\n${lines.join(",\n")},\n${indent})`;
}

function timelineArrayLit(entries: TimelineEntry[], indent: string): string {
  if (entries.length === 0) return "()";
  const items = entries.map(
    (e) => `${indent}  (${e.year}, ${e.month}, ${plainMarkupLit(e.content)})`,
  );
  return `(\n${items.join(",\n")},\n${indent})`;
}

// Build a `main.typ` source that imports the resume template and applies it
// with user data. Data-value fields flow through `plainMarkupLit` (strict
// escaping — no Typst markup leaks through); opt-in free-text fields
// (志望動機 / 本人希望記入欄) flow through `rawMarkupLit`, which lets the
// user write full Typst markup including `#link(...)`, headings, lists, etc.
// VFS paths use `stringLit`; numeric fields stay as TypeScript numbers;
// lengths go through a whitelist regex. Adding a new field means classifying
// it (data vs opt-in markup) and picking the matching helper.
export function buildMainTyp(data: Fields): string {
  const lines: string[] = [];
  lines.push('#import "./lib.typ": resume');
  lines.push("");
  lines.push("#show: resume.with(");

  if (data.日付 !== "auto") {
    lines.push(`  日付: ${datetimeLit(data.日付)},`);
  }
  lines.push(`  氏名: ${nameTupleLit(data.氏名)},`);
  lines.push(`  氏名ふりがな: ${nameTupleLit(data.氏名ふりがな)},`);
  lines.push(`  生年月日: ${datetimeLit(data.生年月日)},`);
  lines.push(`  性別: ${plainMarkupLit(data.性別)},`);
  if (data.写真) {
    // The template calls `image(写真, ...)` on this value, so we pass the raw
    // VFS path as a string literal rather than wrapping it in `image()` here.
    lines.push(`  写真: ${stringLit(data.写真.vfsPath)},`);
  }
  lines.push(`  現住所: ${contactLit(data.現住所, "  ")},`);
  lines.push(`  連絡先: ${contactLit(data.連絡先, "  ")},`);
  lines.push(`  学歴: ${timelineArrayLit(data.学歴, "  ")},`);
  lines.push(`  職歴: ${timelineArrayLit(data.職歴, "  ")},`);
  lines.push(`  免許・資格: ${timelineArrayLit(data["免許・資格"], "  ")},`);
  lines.push(`  志望動機: ${rawMarkupLit(data.志望動機)},`);
  lines.push(`  本人希望記入欄: ${rawMarkupLit(data.本人希望記入欄)},`);
  lines.push(`  学歴・職歴の最小行数: ${data["学歴・職歴の最小行数"]},`);
  lines.push(`  学歴と職歴の間の空行数: ${data.学歴と職歴の間の空行数},`);
  lines.push(`  免許・資格の最小行数: ${data["免許・資格の最小行数"]},`);
  lines.push(`  志望動機の高さ: ${lengthLit(data.志望動機の高さ)},`);
  lines.push(
    `  本人希望記入欄の高さ: ${lengthLit(data.本人希望記入欄の高さ)},`,
  );
  lines.push(")");
  lines.push("");

  return lines.join("\n");
}
