import type { Fields, Party } from "./schema";

const EMPTY_PARTY: Party = { name: "", "postal-code": "", address: "" };
const EMPTY_ACCOUNT: Fields["account"] = {
  bank: "",
  branch: "",
  type: "",
  number: "",
  holder: "",
};

export const EMPTY_FIELDS: Fields = {
  title: "請求書",
  date: "auto",
  "invoice-number-series": 1,
  "due-date": { year: 2026, month: 1, day: 31 },
  recipient: { ...EMPTY_PARTY },
  issuer: { ...EMPTY_PARTY },
  account: { ...EMPTY_ACCOUNT },
  items: [],
  "min-item-rows": 10,
  "tax-rate": 0.1,
  body: "",
};

export const SAMPLE_FIELDS: Fields = {
  title: "請求書",
  date: "auto",
  "invoice-number-series": 1,
  "due-date": { year: 2026, month: 5, day: 31 },
  recipient: {
    name: "株式会社サンプル",
    "postal-code": "100-0001",
    address: "東京都千代田区◯◯ 1-2-3",
  },
  issuer: {
    name: "請求書 太郎",
    "postal-code": "123-4567",
    address: "◯◯県△△市□□町 1-2-3",
  },
  account: {
    bank: "◯◯銀行",
    branch: "△△支店",
    type: "普通",
    number: "1234567",
    holder: "セイキュウショ タロウ",
  },
  items: [
    { name: "作業費", amount: 10, unit: "時間", price: 5000 },
    { name: "交通費", amount: 1, unit: "式", price: 1200 },
  ],
  "min-item-rows": 10,
  "tax-rate": 0.1,
  body: "お振込手数料は貴社にてご負担ください。",
};

// Last day of the month *after* `now`. `new Date(y, m + 2, 0)` asks for day 0
// of the month two ahead, which JS normalizes to the final day of the month
// after `now` — leap-year and year-rollover cases fall out of this math for
// free. Callers use it as a business-sensible default due-date for fresh
// invoices.
export function nextMonthEnd(now: Date = new Date()): Fields["due-date"] {
  const d = new Date(now.getFullYear(), now.getMonth() + 2, 0);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}
