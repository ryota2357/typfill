import { describe, expect, it } from "vitest";
import { buildMainTyp } from "./codegen";
import { EMPTY_FIELDS, SAMPLE_FIELDS } from "./defaults";
import type { Fields } from "./schema";

function clone(data: Fields): Fields {
  return structuredClone(data);
}

describe("buildMainTyp — structure", () => {
  it("starts with the lib import and show-rule", () => {
    const out = buildMainTyp(SAMPLE_FIELDS);
    expect(out).toContain('#import "./lib.typ": invoice');
    expect(out).toContain("#show: invoice.with(");
  });

  it("emits every required named argument for sample data", () => {
    const out = buildMainTyp(SAMPLE_FIELDS);
    for (const arg of [
      "title:",
      "invoice-number-series:",
      "due-date:",
      "recipient:",
      "issuer:",
      "account:",
      "items:",
      "min-item-rows:",
      "tax-rate:",
    ]) {
      expect(out).toContain(arg);
    }
  });
});

describe("buildMainTyp — date", () => {
  it("omits date when set to 'auto'", () => {
    const out = buildMainTyp({ ...clone(SAMPLE_FIELDS), date: "auto" });
    expect(out).not.toMatch(/^\s*date:/m);
  });

  it("emits datetime() when date is a concrete record", () => {
    const out = buildMainTyp({
      ...clone(SAMPLE_FIELDS),
      date: { year: 2025, month: 7, day: 15 },
    });
    expect(out).toContain("date: datetime(year: 2025, month: 7, day: 15)");
  });

  it("always emits due-date as a datetime()", () => {
    const out = buildMainTyp({
      ...clone(SAMPLE_FIELDS),
      "due-date": { year: 2027, month: 12, day: 1 },
    });
    expect(out).toContain("due-date: datetime(year: 2027, month: 12, day: 1)");
  });
});

describe("buildMainTyp — items array", () => {
  it("emits () for empty items", () => {
    const out = buildMainTyp({ ...clone(SAMPLE_FIELDS), items: [] });
    expect(out).toContain("items: ()");
  });

  it("emits each item as a dictionary with named keys", () => {
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      items: [{ name: "作業費", amount: 3, unit: "時間", price: 4500 }],
    });
    expect(out).toMatch(/name: \[作業費\]/);
    expect(out).toMatch(/amount: 3/);
    expect(out).toMatch(/unit: \[時間\]/);
    expect(out).toMatch(/price: 4500/);
  });

  it("omits unit when empty so the template falls back to the no-unit branch", () => {
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      items: [{ name: "交通費", amount: 1, unit: "", price: 1200 }],
    });
    expect(out).not.toContain("unit:");
  });
});

describe("buildMainTyp — recipient / issuer / account", () => {
  it("emits party records with postal-code (not postal-ccode)", () => {
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      recipient: {
        name: "◯◯株式会社",
        "postal-code": "100-0001",
        address: "東京都千代田区◯◯",
      },
    });
    expect(out).toContain("name: [◯◯株式会社]");
    // Plain markup escapes `-` so a postal code reads as plain digits, not
    // a bullet list.
    expect(out).toContain("postal-code: [100\\-0001]");
    expect(out).not.toContain("postal-ccode");
  });

  it("emits account record with all five fields", () => {
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      account: {
        bank: "◯◯銀行",
        branch: "△△支店",
        type: "普通",
        number: "1234567",
        holder: "タナカ タロウ",
      },
    });
    expect(out).toContain("bank: [◯◯銀行]");
    expect(out).toContain("branch: [△△支店]");
    expect(out).toContain("type: [普通]");
    expect(out).toContain("number: [1234567]");
    expect(out).toContain("holder: [タナカ タロウ]");
  });
});

describe("buildMainTyp — body (rawMarkupLit)", () => {
  it("appends body as a #eval expression after the show-rule", () => {
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      body: "お振込手数料は貴社にてご負担ください。",
    });
    expect(out).toContain(
      '#eval("お振込手数料は貴社にてご負担ください。", mode: "markup")',
    );
    // And the body eval lives after the closing paren of the show-rule, not
    // inside it.
    const showEnd = out.indexOf("#show: invoice.with(");
    const evalStart = out.indexOf("#eval(");
    expect(showEnd).toBeGreaterThanOrEqual(0);
    expect(evalStart).toBeGreaterThan(showEnd);
  });

  it("lets Typst markup pass through the body verbatim (inside the eval string)", () => {
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      body: "== 見出し\n- 箇条",
    });
    expect(out).toContain('#eval("== 見出し\\n- 箇条", mode: "markup")');
  });

  it("keeps adversarial brackets/backticks contained inside the string", () => {
    // `]` and unclosed backtick would break a `[...]` wrapper, but eval's
    // string argument is opaque to the outer parser.
    const out = buildMainTyp({ ...clone(EMPTY_FIELDS), body: "]`unclosed" });
    expect(out).toContain('#eval("]`unclosed", mode: "markup")');
  });
});

describe("buildMainTyp — data-field escaping (plainMarkupLit)", () => {
  it("escapes markup specials in title", () => {
    const out = buildMainTyp({ ...clone(EMPTY_FIELDS), title: "[請求書]" });
    expect(out).toContain("title: [\\[請求書\\]]");
  });

  it("escapes markup specials in item name", () => {
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      items: [{ name: "*品名*", amount: 1, unit: "", price: 100 }],
    });
    expect(out).toContain("name: [\\*品名\\*]");
  });

  it("escapes heading markers that previously leaked", () => {
    // Regression: `==` used to pass through unchanged — the old markupLit
    // escape set did not cover it.
    const out = buildMainTyp({ ...clone(EMPTY_FIELDS), title: "== タイトル" });
    expect(out).toContain("title: [\\=\\= タイトル]");
  });

  it("escapes code-injection attempts in issuer name", () => {
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      issuer: {
        name: "#sys.call()",
        "postal-code": "",
        address: "",
      },
    });
    // Parens are not markup-significant in Typst, so they pass through; only
    // `#` is escaped to prevent the expression from switching to code mode.
    expect(out).toContain("name: [\\#sys.call()]");
  });
});

describe("buildMainTyp — numeric passthrough", () => {
  it("emits integer amounts/prices as-is", () => {
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      "invoice-number-series": 42,
      "min-item-rows": 15,
      "tax-rate": 0.08,
    });
    expect(out).toContain("invoice-number-series: 42");
    expect(out).toContain("min-item-rows: 15");
    expect(out).toContain("tax-rate: 0.08");
  });
});
