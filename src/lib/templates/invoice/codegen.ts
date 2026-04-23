import { escapeMarkup, markupLit } from "$lib/typst/escape";
import type { Fields, InvoiceItem, Party } from "./schema";

type Account = Fields["account"];
type DateRecord = { year: number; month: number; day: number };

function datetimeLit(d: DateRecord): string {
  return `datetime(year: ${d.year}, month: ${d.month}, day: ${d.day})`;
}

function partyLit(p: Party, indent: string): string {
  const lines = [
    `${indent}  name: ${markupLit(p.name)}`,
    `${indent}  postal-code: ${markupLit(p["postal-code"])}`,
    `${indent}  address: ${markupLit(p.address)}`,
  ];
  return `(\n${lines.join(",\n")},\n${indent})`;
}

function accountLit(a: Account, indent: string): string {
  const lines = [
    `${indent}  bank: ${markupLit(a.bank)}`,
    `${indent}  branch: ${markupLit(a.branch)}`,
    `${indent}  type: ${markupLit(a.type)}`,
    `${indent}  number: ${markupLit(a.number)}`,
    `${indent}  holder: ${markupLit(a.holder)}`,
  ];
  return `(\n${lines.join(",\n")},\n${indent})`;
}

function itemLit(it: InvoiceItem, indent: string): string {
  const fields = [
    `${indent}    name: ${markupLit(it.name)}`,
    `${indent}    amount: ${it.amount}`,
  ];
  // Upstream template uses `item.at("unit", default: none)`; omitting the field
  // when the user left it blank keeps the rendered amount column tidy
  // (no dangling trailing space).
  if (it.unit !== "") {
    fields.push(`${indent}    unit: ${markupLit(it.unit)}`);
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
// with user data. Named parameters go inside `#show: invoice.with(...)`; the
// `body` parameter (備考欄) is the document content that follows.
export function buildMainTyp(data: Fields): string {
  const lines: string[] = [];
  lines.push('#import "./lib.typ": invoice');
  lines.push("");
  lines.push("#show: invoice.with(");

  lines.push(`  title: ${markupLit(data.title)},`);
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
  // document top-level is itself markup context, so we emit escaped text
  // directly rather than wrapping it in a `[...]` content block.
  lines.push(escapeMarkup(data.body));
  lines.push("");

  return lines.join("\n");
}
