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
    expect(out).toContain('#import "./lib.typ": resume');
    expect(out).toContain("#show: resume.with(");
    expect(out.trimEnd().endsWith(")")).toBe(true);
  });

  it("emits every required field for sample data", () => {
    const out = buildMainTyp(SAMPLE_FIELDS);
    for (const field of [
      "氏名:",
      "氏名ふりがな:",
      "生年月日:",
      "性別:",
      "現住所:",
      "連絡先:",
      "学歴:",
      "職歴:",
      "免許・資格:",
      "志望動機:",
      "本人希望記入欄:",
      "params:",
    ]) {
      expect(out).toContain(field);
    }
  });
});

describe("buildMainTyp — 日付", () => {
  it("omits 日付 when set to 'auto'", () => {
    const out = buildMainTyp({ ...clone(SAMPLE_FIELDS), 日付: "auto" });
    expect(out).not.toContain("日付:");
  });

  it("emits datetime() when 日付 is a concrete date", () => {
    const out = buildMainTyp({
      ...clone(SAMPLE_FIELDS),
      日付: { year: 2025, month: 6, day: 15 },
    });
    expect(out).toContain("日付: datetime(year: 2025, month: 6, day: 15)");
  });
});

describe("buildMainTyp — 写真", () => {
  it("omits 写真 when null", () => {
    const out = buildMainTyp({ ...clone(SAMPLE_FIELDS), 写真: null });
    expect(out).not.toContain("写真:");
  });

  it("emits the VFS path as a string when present", () => {
    const out = buildMainTyp({
      ...clone(SAMPLE_FIELDS),
      写真: {
        vfsPath: "/assets/photo.jpg",
        bytes: new Uint8Array([0xff, 0xd8]),
      },
    });
    expect(out).toContain('写真: "/assets/photo.jpg"');
  });

  it("escapes quotes in the VFS path", () => {
    const out = buildMainTyp({
      ...clone(SAMPLE_FIELDS),
      写真: { vfsPath: '/a"b.jpg', bytes: new Uint8Array() },
    });
    expect(out).toContain('写真: "/a\\"b.jpg"');
  });
});

describe("buildMainTyp — timeline arrays", () => {
  it("emits () for empty arrays", () => {
    const out = buildMainTyp({
      ...clone(SAMPLE_FIELDS),
      学歴: [],
      職歴: [],
      "免許・資格": [],
    });
    expect(out).toContain("学歴: ()");
    expect(out).toContain("職歴: ()");
    expect(out).toContain("免許・資格: ()");
  });

  it("emits tuples (year, month, [content]) in order", () => {
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      学歴: [
        { year: 2020, month: 4, content: "入学" },
        { year: 2024, month: 3, content: "卒業" },
      ],
    });
    expect(out).toContain("(2020, 4, [入学])");
    expect(out).toContain("(2024, 3, [卒業])");
  });
});

describe("buildMainTyp — data-field escaping (plainMarkupLit)", () => {
  it("escapes markup-significant characters in 氏名", () => {
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      氏名: { 姓: "#danger", 名: "[inner]" },
    });
    expect(out).toContain("氏名: ([\\#danger], [\\[inner\\]])");
  });

  it("escapes @ in E-mail so it cannot be parsed as a reference", () => {
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      現住所: {
        郵便番号: "",
        住所: "",
        住所ふりがな: "",
        電話: "",
        "E-mail": "user@example.com",
      },
    });
    expect(out).toContain("E-mail: [user\\@example.com]");
  });

  it("escapes markup specials in timeline content", () => {
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      "免許・資格": [{ year: 2020, month: 1, content: "*bold* not bold" }],
    });
    expect(out).toContain("(2020, 1, [\\*bold\\* not bold])");
  });

  it("escapes heading markers in data fields (previously leaked)", () => {
    // Regression: `==` used to survive the old markupLit escape set, so a
    // name like "== リンク" would render as a section heading inside the PDF.
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      氏名: { 姓: "== 大きく", 名: "" },
    });
    expect(out).toContain("氏名: ([\\=\\= 大きく], [])");
  });

  it("escapes list markers in data fields (previously leaked)", () => {
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      氏名: { 姓: "- item", 名: "+ num" },
    });
    expect(out).toContain("氏名: ([\\- item], [\\+ num])");
  });
});

describe("buildMainTyp — opt-in markup fields (rawMarkupLit)", () => {
  it("wraps 志望動機 in eval(..., mode: markup)", () => {
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      志望動機: "hello",
    });
    expect(out).toContain('志望動機: eval("hello", mode: "markup")');
  });

  it("passes Typst function calls through 志望動機 untouched", () => {
    const src = '#link("https://example.com")[link]';
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      志望動機: src,
    });
    // Inside the string literal quotes and backslashes are escaped, but the
    // Typst syntax itself (`#link`, `[...]`) remains verbatim — it will be
    // parsed by `eval` at compile time.
    expect(out).toContain(
      'eval("#link(\\"https://example.com\\")[link]", mode: "markup")',
    );
  });

  it("contains adversarial brackets without unbalancing the outer Typst", () => {
    // A lone `]` inside the user's content would unbalance a `[...]` wrapper,
    // but `rawMarkupLit` emits `eval(string, …)` so the content is opaque to
    // the outer parser.
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      志望動機: "]",
      本人希望記入欄: "`unclosed",
    });
    expect(out).toContain('志望動機: eval("]", mode: "markup")');
    expect(out).toContain(
      '本人希望記入欄: eval("`unclosed", mode: "markup")',
    );
  });

  it("also applies rawMarkupLit to 本人希望記入欄", () => {
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      本人希望記入欄: "== 見出し\n- 箇条",
    });
    expect(out).toContain(
      '本人希望記入欄: eval("== 見出し\\n- 箇条", mode: "markup")',
    );
  });
});

describe("buildMainTyp — params validation", () => {
  it("passes through valid length literals", () => {
    const out = buildMainTyp({
      ...clone(EMPTY_FIELDS),
      params: {
        "学歴・職歴の最小行数": 22,
        学歴と職歴の間の空行数: 1,
        "免許・資格の最小行数": 6,
        志望動機の高さ: "22em",
        本人希望記入欄の高さ: "10em",
      },
    });
    expect(out).toContain("志望動機の高さ: 22em");
    expect(out).toContain("本人希望記入欄の高さ: 10em");
  });

  it("rejects arbitrary strings as length literals", () => {
    expect(() =>
      buildMainTyp({
        ...clone(EMPTY_FIELDS),
        params: {
          "学歴・職歴の最小行数": 22,
          学歴と職歴の間の空行数: 1,
          "免許・資格の最小行数": 6,
          // Code-injection attempt — must not reach the Typst source.
          志望動機の高さ: "22em); #sys.exit() //",
          本人希望記入欄の高さ: "10em",
        },
      }),
    ).toThrowError(/Invalid Typst length/);
  });
});
