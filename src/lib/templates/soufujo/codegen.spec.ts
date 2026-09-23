import { describe, expect, it } from "vitest";
import { buildMainTyp } from "./codegen";
import { EMPTY_PROPS, SAMPLE_PROPS } from "./defaults";
import type { TemplateProps } from "./schema";

function clone(data: TemplateProps): TemplateProps {
  return structuredClone(data);
}

describe("buildMainTyp — structure", () => {
  it("starts with the lib import and show-rule", () => {
    const out = buildMainTyp(SAMPLE_PROPS);
    expect(out).toContain('#import "./lib.typ": soufujo');
    expect(out).toContain("#show: soufujo.with(");
  });

  it("emits every named argument for sample data", () => {
    const out = buildMainTyp(SAMPLE_PROPS);
    for (const arg of [
      "宛先:",
      "差出人:",
      "件名:",
      "頭語:",
      "結語:",
      "同封物:",
    ]) {
      expect(out).toContain(arg);
    }
  });
});

describe("buildMainTyp — date", () => {
  it("omits 日付 when set to 'auto'", () => {
    const out = buildMainTyp({ ...clone(SAMPLE_PROPS), 日付: "auto" });
    expect(out).not.toMatch(/^\s*日付:/m);
  });

  it("emits datetime() when 日付 is a concrete record", () => {
    const out = buildMainTyp({
      ...clone(SAMPLE_PROPS),
      日付: { year: 2025, month: 7, day: 15 },
    });
    expect(out).toContain("日付: datetime(year: 2025, month: 7, day: 15)");
  });
});

describe("buildMainTyp — blank fields are omitted (upstream `none`)", () => {
  it("drops blank sender fields", () => {
    const data = clone(SAMPLE_PROPS);
    data.差出人.電話 = "";
    data.差出人.会社名 = "  ";
    const out = buildMainTyp(data);
    expect(out).not.toContain("電話:");
    expect(out).not.toMatch(/^\s*会社名: \[\s*\]/m);
    expect(out).toContain("氏名: [送付 太郎]");
  });

  it("emits an empty dictionary when every sender field is blank", () => {
    const out = buildMainTyp(clone(EMPTY_PROPS));
    expect(out).toContain("差出人: (:)");
  });

  it("drops a blank recipient 氏名 so upstream falls back to 御中", () => {
    const data = clone(SAMPLE_PROPS);
    data.宛先.氏名 = "";
    const out = buildMainTyp(data);
    expect(out).toContain("部署: [△△部]");
    expect(out).not.toContain("氏名: [□□ □□]");
  });

  it("omits blank 件名 and 備考", () => {
    const out = buildMainTyp({ ...clone(SAMPLE_PROPS), 件名: "", 備考: "" });
    expect(out).not.toContain("件名:");
    expect(out).not.toContain("備考:");
  });

  it("emits none for blank 頭語 / 結語", () => {
    const out = buildMainTyp({ ...clone(SAMPLE_PROPS), 頭語: "", 結語: "" });
    expect(out).toContain("頭語: none");
    expect(out).toContain("結語: none");
  });
});

describe("buildMainTyp — 同封物", () => {
  it("emits () for no enclosures", () => {
    const out = buildMainTyp({ ...clone(SAMPLE_PROPS), 同封物: [] });
    expect(out).toContain("同封物: ()");
  });

  it("emits a (名前, 数量) pair, or the bare 名前 when 数量 is blank", () => {
    const out = buildMainTyp({
      ...clone(EMPTY_PROPS),
      同封物: [
        { 名前: "社員証", 数量: "1枚" },
        { 名前: "貸与資料", 数量: "" },
      ],
    });
    expect(out).toContain("([社員証], [1枚])");
    expect(out).toMatch(/^\s*\[貸与資料\],$/m);
  });
});

describe("buildMainTyp — escaping", () => {
  it("escapes markup specials in data fields", () => {
    const data = clone(EMPTY_PROPS);
    data.件名 = "== #sys";
    data.差出人["E-mail"] = "a@example.com";
    const out = buildMainTyp(data);
    expect(out).toContain("件名: [\\=\\= \\#sys]");
    expect(out).toContain("E-mail: [a\\@example.com]");
  });

  it("passes 本文 through rawMarkupLit after the show-rule", () => {
    const out = buildMainTyp({ ...clone(EMPTY_PROPS), 本文: "]`本文\n続き" });
    expect(out).toContain('#eval("]`本文\\n続き", mode: "markup")');
    expect(out.indexOf("#eval(")).toBeGreaterThan(out.indexOf("#show:"));
  });

  it("passes 備考 through rawMarkupLit", () => {
    const out = buildMainTyp({ ...clone(EMPTY_PROPS), 備考: "- 項目" });
    expect(out).toContain('備考: eval("- 項目", mode: "markup")');
  });
});
