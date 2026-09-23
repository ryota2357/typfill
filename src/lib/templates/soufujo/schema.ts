import { is, type PredicateType } from "@core/unknownutil";

// Predicates for 送付状 data. Every slot that upstream accepts as `none` is
// modelled as a plain string here; codegen maps a blank string to `none`
// (by omitting the key, or emitting `none` for 頭語 / 結語) so the form never
// needs a separate enabled/disabled toggle per field.

const isDate = is.ObjectOf({
  year: is.Number,
  month: is.Number,
  day: is.Number,
});
export type PlainDate = PredicateType<typeof isDate>;

const isRecipient = is.ObjectOf({
  会社名: is.String,
  部署: is.String,
  氏名: is.String,
});
export type Recipient = PredicateType<typeof isRecipient>;

const isSender = is.ObjectOf({
  郵便番号: is.String,
  住所: is.String,
  会社名: is.String,
  部署: is.String,
  氏名: is.String,
  電話: is.String,
  "E-mail": is.String,
});
export type Sender = PredicateType<typeof isSender>;

const isEnclosure = is.ObjectOf({
  名前: is.String,
  数量: is.String,
});
export type Enclosure = PredicateType<typeof isEnclosure>;

export const isTemplateProps = is.ObjectOf({
  日付: is.UnionOf([is.LiteralOf("auto"), isDate]),
  宛先: isRecipient,
  差出人: isSender,
  件名: is.String,
  頭語: is.String,
  結語: is.String,
  同封物: is.ArrayOf(isEnclosure),
  本文: is.String,
  備考: is.String,
});
export type TemplateProps = PredicateType<typeof isTemplateProps>;
