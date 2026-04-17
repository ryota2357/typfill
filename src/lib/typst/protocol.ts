// Wire protocol between main thread and Typst Web Worker.
//
// `sources` holds text files (the template's `.typ` sources) keyed by VFS path.
// `assets` holds binary files (e.g. a resume photo) keyed by VFS path; the
// generated `.typ` references them via `image("/path/...")`.
// Each compile fully replaces both maps in the worker's VFS — stale entries
// from prior jobs are removed.

export type TypstSources = Record<string, string>;
export type TypstAssets = Record<string, Uint8Array>;

export type TypstDiagnostic = {
	package: string;
	path: string;
	severity: string;
	range: string;
	message: string;
};

type BaseRequest = {
	id: number;
	sources: TypstSources;
	mainPath: string;
	assets?: TypstAssets;
};

export type TypstRequest =
	| ({ type: 'compile' } & BaseRequest)
	| ({ type: 'export-pdf' } & BaseRequest);

export type TypstCompileResponse = {
	id: number;
	ok: true;
	type: 'compile';
	svg: string;
	diagnostics: TypstDiagnostic[];
};

export type TypstExportPdfResponse = {
	id: number;
	ok: true;
	type: 'export-pdf';
	pdf: Uint8Array;
	diagnostics: TypstDiagnostic[];
};

export type TypstErrorResponse = {
	id: number;
	ok: false;
	error: string;
	diagnostics: TypstDiagnostic[];
};

export type TypstResponse = TypstCompileResponse | TypstExportPdfResponse | TypstErrorResponse;
