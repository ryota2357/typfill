import { plainMarkupLit, rawMarkupLit } from "$lib/typst/escape";
import type { Fields, InvoiceItem, Party } from "./schema";

type Account = Fields["account"];
type DateRecord = { year: number; month: number; day: number };

function datetimeLit(d: DateRecord): string {
  return `datetime(year: ${d.year}, month: ${d.month}, day: ${d.day})`;
}

function partyLit(p: Party, indent: string): string {
  const lines = [
    `${indent}  name: ${plainMarkupLit(p.name)}`,
    `${indent}  postal-code: ${plainMarkupLit(p["postal-code"])}`,
    `${indent}  address: ${plainMarkupLit(p.address)}`,
  ];
  return `(\n${lines.join(",\n")},\n${indent})`;
}

function accountLit(a: Account, indent: string): string {
  const lines = [
    `${indent}  bank: ${plainMarkupLit(a.bank)}`,
    `${indent}  branch: ${plainMarkupLit(a.branch)}`,
    `${indent}  type: ${plainMarkupLit(a.type)}`,
    `${indent}  number: ${plainMarkupLit(a.number)}`,
    `${indent}  holder: ${plainMarkupLit(a.holder)}`,
  ];
  return `(\n${lines.join(",\n")},\n${indent})`;
}

function itemLit(it: InvoiceItem, indent: string): string {
  const fields = [
    `${indent}    name: ${plainMarkupLit(it.name)}`,
    `${indent}    amount: ${it.amount}`,
  ];
  // Upstream template uses `item.at("unit", default: none)`; omitting the field
  // when the user left it blank keeps the rendered amount column tidy
  // (no dangling trailing space).
  if (it.unit !== "") {
    fields.push(`${indent}    unit: ${plainMarkupLit(it.unit)}`);
  }
  fields.push(`${indent}    price: ${it.price}`);
  return `(\n${fields.join(",\n")},\n${indent}  )`;
}

function itemsArrayLit(items: InvoiceItem[], indent: string): string {
  if (items.length === 0) return "()";
  const rendered = items.map((it) => `${indent}  ${itemLit(it, indent)}`);
  return `(\n${rendered.join(",\n")},\n${indent})`;
}

// Build a `main.typ` source that imports the invoice template and applies it
// with user data. Data-value fields flow through `plainMarkupLit` (strict
// escaping); the `body` (備考) field uses `rawMarkupLit` so users can write
// full Typst markup (headings, lists, `#link(...)`, math) in the memo area.
// The body is emitted as a `#eval(...)` expression at the document top so
// its output joins the main markup flow.
export function buildMainTyp(data: Fields): string {
  const lines: string[] = [];
  lines.push('#import "./lib.typ": invoice');
  lines.push("");
  lines.push("#show: invoice.with(");

  lines.push(`  title: ${plainMarkupLit(data.title)},`);
  if (data.date !== "auto") {
    lines.push(`  date: ${datetimeLit(data.date)},`);
  }
  lines.push(`  invoice-number-series: ${data["invoice-number-series"]},`);
  lines.push(`  due-date: ${datetimeLit(data["due-date"])},`);
  lines.push(`  recipient: ${partyLit(data.recipient, "  ")},`);
  lines.push(`  issuer: ${partyLit(data.issuer, "  ")},`);
  lines.push(`  account: ${accountLit(data.account, "  ")},`);
  lines.push(`  items: ${itemsArrayLit(data.items, "  ")},`);
  lines.push(`  min-item-rows: ${data["min-item-rows"]},`);
  lines.push(`  tax-rate: ${data["tax-rate"]},`);
  lines.push(")");
  lines.push("");

  // `body` is taken from the document content after the `#show:` rule. The
  // document top-level is itself markup context, so we emit a `#`-prefixed
  // code expression that evaluates the user string as markup. The resulting
  // content is spliced into the document flow exactly as if the user had
  // typed the markup at this position (modulo eval's fresh-scope rule, which
  // only matters for user-defined symbols — standard library functions stay
  // available).
  lines.push(`#${rawMarkupLit(data.body)}`);
  lines.push("");

  return lines.join("\n");
}
