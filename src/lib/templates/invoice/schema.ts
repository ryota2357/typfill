import { is, type PredicateType } from "@core/unknownutil";

// Predicates for invoice data. Shape is JSON-safe end to end (no Uint8Array),
// so the runtime and wire representations coincide and we skip the
// runtime/wire split that resume needs for its photo bytes.

const isDateRecord = is.ObjectOf({
  year: is.Number,
  month: is.Number,
  day: is.Number,
});

const isParty = is.ObjectOf({
  name: is.String,
  "postal-code": is.String,
  address: is.String,
});

const isAccount = is.ObjectOf({
  bank: is.String,
  branch: is.String,
  type: is.String,
  number: is.String,
  holder: is.String,
});

const isInvoiceItem = is.ObjectOf({
  name: is.String,
  amount: is.Number,
  unit: is.String,
  price: is.Number,
});

export const isFields = is.ObjectOf({
  title: is.String,
  date: is.UnionOf([is.LiteralOf("auto"), isDateRecord]),
  "invoice-number-series": is.Number,
  "due-date": isDateRecord,
  recipient: isParty,
  issuer: isParty,
  account: isAccount,
  items: is.ArrayOf(isInvoiceItem),
  "min-item-rows": is.Number,
  "tax-rate": is.Number,
  body: is.String,
});

export type Fields = PredicateType<typeof isFields>;

// Per-field shape aliases. Only named when the same shape appears on 2+ fields
// or when the alias carries a distinct semantic label worth surfacing to
// consumers; single-use shapes are accessed via `Fields["…"]` directly.
export type Party = Fields["recipient"]; // shared by recipient / issuer
export type InvoiceItem = Fields["items"][number]; // referenced by form UI
