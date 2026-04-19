import type { Fields, TimelineEntry } from "./schema";

// Layout defaults track the upstream Typst template signature; see
// `template/lib.typ`.
const DEFAULT_PARAMS: Fields["params"] = {
  "学歴・職歴の最小行数": 22,
  学歴と職歴の間の空行数: 1,
  "免許・資格の最小行数": 6,
  志望動機の高さ: "22em",
  本人希望記入欄の高さ: "10em",
};

export const EMPTY_FIELDS: Fields = {
  日付: "auto",
  氏名: { 姓: "", 名: "" },
  氏名ふりがな: { 姓: "", 名: "" },
  生年月日: { year: 2000, month: 1, day: 1 },
  性別: "",
  写真: null,
  現住所: { 郵便番号: "", 住所: "", 住所ふりがな: "", 電話: "", "E-mail": "" },
  連絡先: { 郵便番号: "", 住所: "", 住所ふりがな: "", 電話: "", "E-mail": "" },
  学歴: [],
  職歴: [],
  "免許・資格": [],
  志望動機: "",
  本人希望記入欄: "",
  params: DEFAULT_PARAMS,
};

export const SAMPLE_FIELDS: Fields = {
  日付: "auto",
  氏名: { 姓: "履歴書", 名: "太郎" },
  氏名ふりがな: { 姓: "りれきしょ", 名: "たろう" },
  生年月日: { year: 2001, month: 2, day: 3 },
  性別: "男",
  写真: null,
  現住所: {
    郵便番号: "123-4567",
    住所: "◯◯県△△市□□町 1-2-3",
    住所ふりがな: "まるまるけん さんかくさんかくし しかくしかくまち 1-2-3",
    電話: "090-1234-5678",
    "E-mail": "example@example.com",
  },
  連絡先: {
    郵便番号: "",
    住所: "",
    住所ふりがな: "",
    電話: "",
    "E-mail": "",
  },
  学歴: [
    { year: 2017, month: 4, content: "◯◯県立△△高等学校 入学" },
    { year: 2020, month: 3, content: "◯◯県立△△高等学校 卒業" },
    { year: 2020, month: 4, content: "◯◯大学 △△学部 入学" },
    { year: 2024, month: 3, content: "◯◯大学 △△学部 卒業" },
    { year: 2024, month: 4, content: "◯◯大学大学院 △△研究科 入学" },
    { year: 2026, month: 3, content: "◯◯大学大学院 △△研究科 修了" },
  ],
  職歴: [],
  "免許・資格": [
    { year: 2019, month: 6, content: "基本情報技術者" },
    { year: 2021, month: 10, content: "普通自動車一種免許" },
  ],
  志望動機: "",
  本人希望記入欄: "貴社規定に従います。",
  params: DEFAULT_PARAMS,
};

// New timeline rows default to the current year/month so users edit forward
// from a sensible value rather than from `0年0月`.
export function newTimelineEntry(now: Date = new Date()): TimelineEntry {
  return { year: now.getFullYear(), month: now.getMonth() + 1, content: "" };
}
