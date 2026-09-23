import { plainMarkupLit, rawMarkupLit } from "$lib/typst/escape";
import type {
  Enclosure,
  PlainDate,
  Recipient,
  Sender,
  TemplateProps,
} from "./schema";

function datetimeLit(d: PlainDate): string {
  return `datetime(year: ${d.year}, month: ${d.month}, day: ${d.day})`;
}

function isBlank(value: string): boolean {
  return value.trim() === "";
}

// Upstream reads every sub-field with `.at(key, default: none)`, so leaving a
// key out is how we say "none". Blank strings are dropped rather than emitted
// as `[]` so e.g. an empty 電話 doesn't render a dangling "電話番号：" line.
function dictLit(entries: [string, string][], indent: string): string {
  const lines = entries
    .filter(([, v]) => !isBlank(v))
    .map(([k, v]) => `${indent}  ${k}: ${plainMarkupLit(v)}`);
  if (lines.length === 0) return "(:)";
  return `(\n${lines.join(",\n")},\n${indent})`;
}

function recipientLit(r: Recipient, indent: string): string {
  return dictLit(
    [
      ["会社名", r.会社名],
      ["部署", r.部署],
      ["氏名", r.氏名],
    ],
    indent,
  );
}

function senderLit(s: Sender, indent: string): string {
  return dictLit(
    [
      ["郵便番号", s.郵便番号],
      ["住所", s.住所],
      ["会社名", s.会社名],
      ["部署", s.部署],
      ["氏名", s.氏名],
      ["電話", s.電話],
      ["E-mail", s["E-mail"]],
    ],
    indent,
  );
}

// Upstream accepts either `名前` alone or a `(名前, 数量)` pair; the bare form
// is used for a blank 数量 so no trailing gap is rendered after the name.
function enclosureLit(e: Enclosure): string {
  if (isBlank(e.数量)) return plainMarkupLit(e.名前);
  return `(${plainMarkupLit(e.名前)}, ${plainMarkupLit(e.数量)})`;
}

function enclosuresArrayLit(items: Enclosure[], indent: string): string {
  if (items.length === 0) return "()";
  const rendered = items.map((e) => `${indent}  ${enclosureLit(e)}`);
  return `(\n${rendered.join(",\n")},\n${indent})`;
}

// `none` suppresses the 頭語 / 結語 entirely upstream; an empty `[]` would
// still leave the full-width separator space before the body.
function optionalMarkupLit(value: string): string {
  return isBlank(value) ? "none" : plainMarkupLit(value);
}

// Build a `main.typ` source that imports the soufujo template and applies it
// with user data. Data-value fields flow through `plainMarkupLit`; the free
// text 本文 / 備考 use `rawMarkupLit` so users can write Typst markup. 本文 is
// emitted as a top-level `#eval(...)` after the show-rule, becoming the
// template's `body` argument.
export function buildMainTyp(data: TemplateProps): string {
  const lines: string[] = [];
  lines.push('#import "./lib.typ": soufujo');
  lines.push("");
  lines.push("#show: soufujo.with(");

  if (data.日付 !== "auto") {
    lines.push(`  日付: ${datetimeLit(data.日付)},`);
  }
  lines.push(`  宛先: ${recipientLit(data.宛先, "  ")},`);
  lines.push(`  差出人: ${senderLit(data.差出人, "  ")},`);
  if (!isBlank(data.件名)) {
    lines.push(`  件名: ${plainMarkupLit(data.件名)},`);
  }
  lines.push(`  頭語: ${optionalMarkupLit(data.頭語)},`);
  lines.push(`  結語: ${optionalMarkupLit(data.結語)},`);
  lines.push(`  同封物: ${enclosuresArrayLit(data.同封物, "  ")},`);
  if (!isBlank(data.備考)) {
    lines.push(`  備考: ${rawMarkupLit(data.備考)},`);
  }
  lines.push(")");
  lines.push("");

  lines.push(`#${rawMarkupLit(data.本文)}`);
  lines.push("");

  return lines.join("\n");
}
