import { is, type PredicateType } from "@core/unknownutil";

// Predicates for runtime resume data (Uint8Array for photo bytes) and its wire
// representation (base64 string for JSON roundtrip). Co-located so the type
// and validator stay in sync via `PredicateType`.

const isResumeDate = is.ObjectOf({
  year: is.Number,
  month: is.Number,
  day: is.Number,
});

const isJapaneseName = is.ObjectOf({
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

const isResumeParams = is.ObjectOf({
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

const isResumePhotoRuntime = is.ObjectOf({
  vfsPath: is.String,
  bytes: isUint8Array,
});

const isResumePhotoWire = is.ObjectOf({
  vfsPath: is.String,
  bytesBase64: is.String,
});

const isDate = is.UnionOf([is.LiteralOf("auto"), isResumeDate]);

export const isFields = is.ObjectOf({
  日付: isDate,
  氏名: isJapaneseName,
  氏名ふりがな: isJapaneseName,
  生年月日: isResumeDate,
  性別: is.String,
  写真: is.UnionOf([is.Null, isResumePhotoRuntime]),
  現住所: isContact,
  連絡先: isContact,
  学歴: is.ArrayOf(isTimelineEntry),
  職歴: is.ArrayOf(isTimelineEntry),
  "免許・資格": is.ArrayOf(isTimelineEntry),
  志望動機: is.String,
  本人希望記入欄: is.String,
  params: isResumeParams,
});

export const isFieldsWire = is.ObjectOf({
  日付: isDate,
  氏名: isJapaneseName,
  氏名ふりがな: isJapaneseName,
  生年月日: isResumeDate,
  性別: is.String,
  写真: is.UnionOf([is.Null, isResumePhotoWire]),
  現住所: isContact,
  連絡先: isContact,
  学歴: is.ArrayOf(isTimelineEntry),
  職歴: is.ArrayOf(isTimelineEntry),
  "免許・資格": is.ArrayOf(isTimelineEntry),
  志望動機: is.String,
  本人希望記入欄: is.String,
  params: isResumeParams,
});

export type Fields = PredicateType<typeof isFields>;
export type FieldsWire = PredicateType<typeof isFieldsWire>;

// Per-field shape aliases. Only named when the same shape appears on 2+ fields
// and the alias carries a distinct semantic label; single-use shapes are
// accessed via `Fields["…"]` directly at the call site.
export type Contact = Fields["現住所"]; // shared by 現住所 / 連絡先
export type TimelineEntry = Fields["学歴"][number]; // shared by 学歴 / 職歴 / 免許・資格
