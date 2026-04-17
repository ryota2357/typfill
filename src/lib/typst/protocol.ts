export type TypstRequest =
	| { id: number; type: 'compile'; sources: Record<string, string>; mainPath: string }
	| { id: number; type: 'export-pdf'; sources: Record<string, string>; mainPath: string };

type DiagnosticMessage = {
	package: string;
	path: string;
	severity: string;
	range: string;
	message: string;
};

export type TypstResponse =
	| { id: number; ok: true; type: 'compile'; svg: string; diagnostics: DiagnosticMessage[] }
	| { id: number; ok: true; type: 'export-pdf'; pdf: Uint8Array; diagnostics: DiagnosticMessage[] }
	| { id: number; ok: false; error: string; diagnostics: DiagnosticMessage[] };
