// Helpers for embedding user-supplied strings into generated Typst source.
//
// Three flavors with distinct purposes — pick the right one per field:
//
//   plainMarkupLit  — treats the input as literal text. Escapes every
//                     character that Typst markup mode interprets so no
//                     formatting leaks through. Use for data fields such as
//                     name, address, phone number.
//
//   rawMarkupLit    — passes the input through as Typst markup (headings,
//                     lists, `#link(...)`, math, raw blocks, etc.). Emitted
//                     as `eval("...", mode: "markup")` so the string is
//                     opaque to our wrapper: any balance of brackets,
//                     backticks, or dollar signs stays contained. Use for
//                     opt-in free-text fields whose textarea hint promises
//                     Typst support.
//
//   stringLit       — produces a Typst `"..."` double-quoted string literal.
//                     Use for non-markup slots like VFS paths.
//
// `rawMarkupLit` intentionally allows Typst code (`#` expressions). XSS from
// compiled SVG is mitigated separately: `Preview.svelte` renders output via
// `<img src=blob:...>`, which disables scripts / event handlers / foreign
// objects inside the SVG. Any new rendering path must preserve that sandbox.

// Every character that carries meaning in Typst markup mode. Escaping all of
// these turns the input into literal text with no formatting.
const PLAIN_MARKUP_SPECIAL = /[\\[\]#<>`@$*_=+\-/~]/g;

export function escapePlainMarkup(value: string): string {
  return value.replace(PLAIN_MARKUP_SPECIAL, (ch) => `\\${ch}`);
}

// Wrap a user string as a Typst content block whose contents render as
// literal text.
export function plainMarkupLit(value: string): string {
  return `[${escapePlainMarkup(value)}]`;
}

// Emit a Typst expression that evaluates the given string as markup.
// `eval(..., mode: "markup")` sidesteps every bracket-balance concern: the
// string is opaque data to the outer compiler and is parsed independently
// once evaluated. Standard-library functions (`link`, `image`, headings,
// lists, …) are in scope inside the evaluated markup.
export function rawMarkupLit(value: string): string {
  return `eval(${stringLit(value)}, mode: "markup")`;
}

const STRING_SPECIAL = /[\\"]/g;
const STRING_NEWLINE = /\r\n|\r|\n/g;

// Escape characters for inside a Typst double-quoted string literal.
// Real newlines become the `\n` escape sequence because Typst string literals
// cannot span raw line breaks.
export function escapeString(value: string): string {
  return value
    .replace(STRING_SPECIAL, (ch) => `\\${ch}`)
    .replace(STRING_NEWLINE, "\\n");
}

// Wrap a user string as a Typst string literal: `"escaped"`.
export function stringLit(value: string): string {
  return `"${escapeString(value)}"`;
}
