// Escape helpers for embedding user-supplied strings into Typst source.
//
// Security boundary: any user input that flows into generated `.typ` must pass
// through these helpers. Unescaped input here means arbitrary Typst code
// execution at compile time.

const MARKUP_SPECIAL = /[\\[\]#<>`@$*_]/g;

// Escape characters that are significant inside a Typst content block (`[...]`).
// Covers the set listed in CONSEPT_AND_PLAN §4.2: # < > ` @ $ * _ \ plus
// balanced brackets.
export function escapeMarkup(value: string): string {
	return value.replace(MARKUP_SPECIAL, (ch) => `\\${ch}`);
}

// Wrap a user string as a Typst markup literal: `[escaped]`.
export function markupLit(value: string): string {
	return `[${escapeMarkup(value)}]`;
}

const STRING_SPECIAL = /[\\"]/g;
const STRING_NEWLINE = /\r\n|\r|\n/g;

// Escape characters for inside a Typst double-quoted string literal.
// Real newlines become the `\n` escape sequence because Typst string literals
// cannot span raw line breaks.
export function escapeString(value: string): string {
	return value.replace(STRING_SPECIAL, (ch) => `\\${ch}`).replace(STRING_NEWLINE, '\\n');
}

// Wrap a user string as a Typst string literal: `"escaped"`.
export function stringLit(value: string): string {
	return `"${escapeString(value)}"`;
}
