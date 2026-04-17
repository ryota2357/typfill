// Resume data model — mirrors the Japanese-named parameters of the upstream
// `#resume(...)` function. See CONSEPT_AND_PLAN §2.1.
//
// Fields use Japanese identifiers (1:1 with the Typst template) to keep the
// translation layer trivial. TypeScript supports Unicode identifiers natively.

export type JapaneseName = {
	姓: string;
	名: string;
};

export type ResumeDate = {
	year: number;
	month: number;
	day: number;
};

export type Contact = {
	郵便番号: string;
	住所: string;
	住所ふりがな: string;
	電話: string;
	'E-mail': string;
};

export type TimelineEntry = {
	year: number;
	month: number;
	content: string;
};

// `bytes` is the raw image payload that gets handed to the Typst VFS at
// compile time, keyed by `vfsPath` (which `image()` references inside the
// generated `.typ`). Bytes are kept inside `ResumeData` so the
// `Component<{ data }>` form interface stays single-prop and so the future
// LocalStorage layer can persist the photo with the rest of the resume.
// `sanitizeForShare` strips the whole field before it reaches a share link
// (CONSEPT_AND_PLAN §1).
export type ResumePhoto = {
	vfsPath: string;
	bytes: Uint8Array;
};

// Typst length literals (e.g. "22em", "10mm"). Validated at codegen time.
export type TypstLength = string;

export type ResumeParams = {
	学歴・職歴の最小行数: number;
	学歴と職歴の間の空行数: number;
	免許・資格の最小行数: number;
	志望動機の高さ: TypstLength;
	本人希望記入欄の高さ: TypstLength;
};

export type ResumeData = {
	日付: ResumeDate | 'auto';
	氏名: JapaneseName;
	氏名ふりがな: JapaneseName;
	生年月日: ResumeDate;
	性別: string;
	写真: ResumePhoto | null;
	現住所: Contact;
	連絡先: Contact;
	学歴: TimelineEntry[];
	職歴: TimelineEntry[];
	免許・資格: TimelineEntry[];
	志望動機: string;
	本人希望記入欄: string;
	params: ResumeParams;
};
