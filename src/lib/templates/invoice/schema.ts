import { is, type PredicateType } from "@core/unknownutil";

// Predicates for invoice data. Shape is JSON-safe end to end (no Uint8Array),
// so the runtime and wire representations coincide and we skip the
// runtime/wire split that resume needs for its photo bytes.

const isDate = is.ObjectOf({
  year: is.Number,
  month: is.Number,
  day: is.Number,
});
export type PlainDate = PredicateType<typeof isDate>;

const isParty = is.ObjectOf({
  name: is.String,
  "postal-code": is.String,
  address: is.String,
});
export type Party = PredicateType<typeof isParty>;

const isAccount = is.ObjectOf({
  bank: is.String,
  branch: is.String,
  type: is.String,
  number: is.String,
  holder: is.String,
});
export type Account = PredicateType<typeof isAccount>;

const isInvoiceItem = is.ObjectOf({
  name: is.String,
  amount: is.Number,
  unit: is.String,
  price: is.Number,
});
export type InvoiceItem = PredicateType<typeof isInvoiceItem>;

export const isTemplateProps = is.ObjectOf({
  title: is.String,
  date: is.UnionOf([is.LiteralOf("auto"), isDate]),
  "invoice-number-series": is.Number,
  "due-date": isDate,
  recipient: isParty,
  issuer: isParty,
  account: isAccount,
  items: is.ArrayOf(isInvoiceItem),
  "min-item-rows": is.Number,
  "tax-rate": is.Number,
  body: is.String,
});
export type TemplateProps = PredicateType<typeof isTemplateProps>;
