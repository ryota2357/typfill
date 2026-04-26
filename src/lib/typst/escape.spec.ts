import { describe, expect, it } from "vitest";
import {
  escapePlainMarkup,
  escapeString,
  plainMarkupLit,
  rawMarkupLit,
  stringLit,
} from "./escape";

describe("escapePlainMarkup", () => {
  it("returns empty string unchanged", () => {
    expect(escapePlainMarkup("")).toBe("");
  });

  it("leaves plain ASCII and Japanese text untouched", () => {
    expect(escapePlainMarkup("山田 太郎 Hello 123")).toBe(
      "山田 太郎 Hello 123",
    );
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
    ["equals", "=", "\\="],
    ["plus", "+", "\\+"],
    ["hyphen", "-", "\\-"],
    ["slash", "/", "\\/"],
    ["tilde", "~", "\\~"],
  ])("escapes %s", (_name, input, expected) => {
    expect(escapePlainMarkup(input)).toBe(expected);
  });

  it("escapes each occurrence in a mixed string", () => {
    expect(escapePlainMarkup("a#b*c_d")).toBe("a\\#b\\*c\\_d");
  });

  it("escapes adjacent duplicates", () => {
    expect(escapePlainMarkup("##")).toBe("\\#\\#");
    expect(escapePlainMarkup("[[]]")).toBe("\\[\\[\\]\\]");
  });

  it("escapes heading and list markers that used to leak", () => {
    // Regression: `==`, `-`, `+`, `/` previously passed through the old
    // escapeMarkup unchanged, so plain-text fields rendered as headings /
    // lists / term-list items. The strict set closes those leaks.
    expect(escapePlainMarkup("== リンク")).toBe("\\=\\= リンク");
    expect(escapePlainMarkup("- item")).toBe("\\- item");
    expect(escapePlainMarkup("+ num")).toBe("\\+ num");
    expect(escapePlainMarkup("/ term")).toBe("\\/ term");
  });

  it("escapes the whole special set at once", () => {
    expect(escapePlainMarkup("\\[]#<>`@$*_=+-/~")).toBe(
      "\\\\\\[\\]\\#\\<\\>\\`\\@\\$\\*\\_\\=\\+\\-\\/\\~",
    );
  });

  it("escapes backslash before letters without doubling escapes", () => {
    // A single backslash in input must produce exactly two backslashes —
    // global replace advances past the inserted `\`, so it is not re-matched.
    expect(escapePlainMarkup("\\n")).toBe("\\\\n");
  });

  it("preserves newlines as whitespace", () => {
    // Paragraph breaks are intentional content; do not alter them.
    expect(escapePlainMarkup("line1\nline2")).toBe("line1\nline2");
  });

  it("handles leading and trailing specials", () => {
    expect(escapePlainMarkup("#abc#")).toBe("\\#abc\\#");
  });
});

describe("plainMarkupLit", () => {
  it("wraps escaped content in brackets", () => {
    expect(plainMarkupLit("hello")).toBe("[hello]");
  });

  it("escapes brackets inside the payload", () => {
    expect(plainMarkupLit("[inner]")).toBe("[\\[inner\\]]");
  });

  it("handles empty input", () => {
    expect(plainMarkupLit("")).toBe("[]");
  });
});

describe("rawMarkupLit", () => {
  it("emits eval(string, mode: markup) for safe content", () => {
    expect(rawMarkupLit("hello")).toBe('eval("hello", mode: "markup")');
  });

  it("handles empty input", () => {
    expect(rawMarkupLit("")).toBe('eval("", mode: "markup")');
  });

  it("preserves arbitrary Typst markup verbatim inside the string", () => {
    expect(rawMarkupLit('#link("https://x")[y]')).toBe(
      'eval("#link(\\"https://x\\")[y]", mode: "markup")',
    );
  });

  it("reuses the stringLit escaping for quotes, backslashes, and newlines", () => {
    expect(rawMarkupLit('a"b')).toBe('eval("a\\"b", mode: "markup")');
    expect(rawMarkupLit("a\\b")).toBe('eval("a\\\\b", mode: "markup")');
    expect(rawMarkupLit("a\nb")).toBe('eval("a\\nb", mode: "markup")');
  });

  it.each([
    ["trailing backslash", "abc\\"],
    ["lone close bracket", "]"],
    ["lone open bracket", "["],
    ["unclosed raw block", "`unclosed"],
    ["unclosed math", "$unclosed"],
    ["nested unbalanced open", "x[y"],
  ])("wraps adversarial input %s as a well-formed eval call", (_name, input) => {
    const wrapped = rawMarkupLit(input);
    // The wrapper has a well-formed outer shape `eval("...", mode: "markup")`.
    // What's inside the quotes is opaque to the Typst parser at the call site —
    // it's an atomic string token followed by a named argument.
    expect(wrapped.startsWith('eval("')).toBe(true);
    expect(wrapped.endsWith('", mode: "markup")')).toBe(true);
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
