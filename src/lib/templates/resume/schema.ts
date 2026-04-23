import { is, type PredicateType } from "@core/unknownutil";

// Runtime predicate for resume data. The codec layer handles `Uint8Array ↔
// base64` transparently (see `$lib/templates/codec`), so the schema describes
// the domain shape only — no separate wire-form predicate.

const isDate = is.ObjectOf({
  year: is.Number,
  month: is.Number,
  day: is.Number,
});

const isName = is.ObjectOf({
  姓: is.String,
  名: is.String,
});

const isContact = is.ObjectOf({
  郵便番号: is.String,
  住所: is.String,
  住所ふりがな: is.String,
  電話: is.String,
  "E-mail": is.String,
});

const isTimelineEntry = is.ObjectOf({
  year: is.Number,
  month: is.Number,
  content: is.String,
});

const isParams = is.ObjectOf({
  "学歴・職歴の最小行数": is.Number,
  学歴と職歴の間の空行数: is.Number,
  "免許・資格の最小行数": is.Number,
  志望動機の高さ: is.String,
  本人希望記入欄の高さ: is.String,
});

// `is.InstanceOf(Uint8Array)` narrows to `Uint8Array<ArrayBuffer>`, which
// conflicts with `new Uint8Array(n)` (`Uint8Array<ArrayBufferLike>`) produced
// by our base64 helpers. A hand-written predicate keeps the default generic.
const isUint8Array = (x: unknown): x is Uint8Array => x instanceof Uint8Array;

const isPhoto = is.ObjectOf({
  vfsPath: is.String,
  bytes: isUint8Array,
});


export const isFields = is.ObjectOf({
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
  params: isParams,
});

export type Fields = PredicateType<typeof isFields>;

// Per-field shape aliases. Only named when the same shape appears on 2+ fields
// and the alias carries a distinct semantic label; single-use shapes are
// accessed via `Fields["…"]` directly at the call site.
export type Contact = Fields["現住所"]; // shared by 現住所 / 連絡先
export type TimelineEntry = Fields["学歴"][number]; // shared by 学歴 / 職歴 / 免許・資格
