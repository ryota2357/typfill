import { describe, expect, it } from "vitest";
import { escapeMarkup, escapeString, markupLit, stringLit } from "./escape";

describe("escapeMarkup", () => {
  it("returns empty string unchanged", () => {
    expect(escapeMarkup("")).toBe("");
  });

  it("leaves plain ASCII and Japanese text untouched", () => {
    expect(escapeMarkup("山田 太郎 Hello 123")).toBe("山田 太郎 Hello 123");
  });

  it.each([
    ["backslash", "\\", "\\\\"],
    ["open bracket", "[", "\\["],
    ["close bracket", "]", "\\]"],
    ["hash", "#", "\\#"],
    ["less than", "<", "\\<"],
    ["greater than", ">", "\\>"],
    ["backtick", "`", "\\`"],
    ["at sign", "@", "\\@"],
    ["dollar", "$", "\\$"],
    ["asterisk", "*", "\\*"],
    ["underscore", "_", "\\_"],
  ])("escapes %s", (_name, input, expected) => {
    expect(escapeMarkup(input)).toBe(expected);
  });

  it("escapes each occurrence in a mixed string", () => {
    expect(escapeMarkup("a#b*c_d")).toBe("a\\#b\\*c\\_d");
  });

  it("escapes adjacent duplicates", () => {
    expect(escapeMarkup("##")).toBe("\\#\\#");
    expect(escapeMarkup("[[]]")).toBe("\\[\\[\\]\\]");
  });

  it("escapes the whole special set at once", () => {
    expect(escapeMarkup("\\[]#<>`@$*_")).toBe(
      "\\\\\\[\\]\\#\\<\\>\\`\\@\\$\\*\\_",
    );
  });

  it("escapes backslash before letters without doubling escapes", () => {
    // A single backslash in input must produce exactly two backslashes —
    // global replace advances past the inserted `\`, so it is not re-matched.
    expect(escapeMarkup("\\n")).toBe("\\\\n");
  });

  it("preserves newlines as whitespace", () => {
    // Paragraph breaks are intentional content; do not alter them.
    expect(escapeMarkup("line1\nline2")).toBe("line1\nline2");
  });

  it("handles leading and trailing specials", () => {
    expect(escapeMarkup("#abc#")).toBe("\\#abc\\#");
  });
});

describe("markupLit", () => {
  it("wraps escaped content in brackets", () => {
    expect(markupLit("hello")).toBe("[hello]");
  });

  it("escapes brackets inside the payload", () => {
    expect(markupLit("[inner]")).toBe("[\\[inner\\]]");
  });

  it("handles empty input", () => {
    expect(markupLit("")).toBe("[]");
  });
});

describe("escapeString", () => {
  it("returns empty string unchanged", () => {
    expect(escapeString("")).toBe("");
  });

  it("leaves plain ASCII and Japanese untouched", () => {
    expect(escapeString("山田 太郎 Hello 123")).toBe("山田 太郎 Hello 123");
  });

  it("escapes backslash", () => {
    expect(escapeString("\\")).toBe("\\\\");
  });

  it("escapes double quote", () => {
    expect(escapeString('"')).toBe('\\"');
  });

  it("escapes backslash followed by quote without over-escaping", () => {
    expect(escapeString('\\"')).toBe('\\\\\\"');
  });

  it("converts LF to \\n", () => {
    expect(escapeString("a\nb")).toBe("a\\nb");
  });

  it("converts CRLF to a single \\n", () => {
    expect(escapeString("a\r\nb")).toBe("a\\nb");
  });

  it("converts lone CR to \\n", () => {
    expect(escapeString("a\rb")).toBe("a\\nb");
  });

  it("handles backslash before a real newline correctly", () => {
    // input: \ + LF → output: \\ + \n (4 chars)
    expect(escapeString("\\\n")).toBe("\\\\\\n");
  });

  it("leaves markup-only specials untouched (not significant in strings)", () => {
    expect(escapeString("#<>`@$*_[]")).toBe("#<>`@$*_[]");
  });
});

describe("stringLit", () => {
  it("wraps escaped content in double quotes", () => {
    expect(stringLit("hello")).toBe('"hello"');
  });

  it("escapes quotes inside the payload", () => {
    expect(stringLit('a"b')).toBe('"a\\"b"');
  });

  it("handles empty input", () => {
    expect(stringLit("")).toBe('""');
  });
});
