import { is, type PredicateType } from "@core/unknownutil";

// Runtime predicate for resume data. The codec layer handles `Uint8Array ↔
// base64` transparently (see `$lib/templates/codec`), so the schema describes
// the domain shape only — no separate wire-form predicate.

const isDate = is.ObjectOf({
  year: is.Number,
  month: is.Number,
  day: is.Number,
});
export type PlainDate = PredicateType<typeof isDate>;

const isName = is.ObjectOf({
  姓: is.String,
  名: is.String,
});
export type Name = PredicateType<typeof isName>;

const isContact = is.ObjectOf({
  郵便番号: is.String,
  住所: is.String,
  住所ふりがな: is.String,
  電話: is.String,
  "E-mail": is.String,
});
export type Contact = PredicateType<typeof isContact>;

const isTimelineEntry = is.ObjectOf({
  year: is.Number,
  month: is.Number,
  content: is.String,
});
export type TimelineEntry = PredicateType<typeof isTimelineEntry>;

// `is.InstanceOf(Uint8Array)` narrows to `Uint8Array<ArrayBuffer>`, which
// conflicts with `new Uint8Array(n)` (`Uint8Array<ArrayBufferLike>`) produced
// by our base64 helpers. A hand-written predicate keeps the default generic.
const isUint8Array = (x: unknown): x is Uint8Array => x instanceof Uint8Array;

const isPhoto = is.ObjectOf({
  vfsPath: is.String,
  bytes: isUint8Array,
});
export type Photo = PredicateType<typeof isPhoto>;

export const isTemplateProps = is.ObjectOf({
  日付: is.UnionOf([is.LiteralOf("auto"), isDate]),
  氏名: isName,
  氏名ふりがな: isName,
  生年月日: isDate,
  性別: is.String,
  写真: is.UnionOf([is.Null, isPhoto]),
  現住所: isContact,
  連絡先: isContact,
  学歴: is.ArrayOf(isTimelineEntry),
  職歴: is.ArrayOf(isTimelineEntry),
  "免許・資格": is.ArrayOf(isTimelineEntry),
  志望動機: is.String,
  本人希望記入欄: is.String,
  "学歴・職歴の最小行数": is.Number,
  学歴と職歴の間の空行数: is.Number,
  "免許・資格の最小行数": is.Number,
  志望動機の高さ: is.String,
  本人希望記入欄の高さ: is.String,
});
export type TemplateProps = PredicateType<typeof isTemplateProps>;
