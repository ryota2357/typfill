import TypstWorker from './worker?worker';
import type {
	TypstAssets,
	TypstDiagnostic,
	TypstRequest,
	TypstResponse,
	TypstSources
} from './protocol';

type Pending = {
	resolve: (value: TypstResponse) => void;
	reject: (reason: Error) => void;
	detach: () => void;
};

// Thrown when the worker reports a failed compile/export. The diagnostics list
// from the failed job is preserved so the UI can still render `error`/`warning`
// entries even though there's no successful artifact.
export class TypstCompileError extends Error {
	diagnostics: TypstDiagnostic[];
	constructor(message: string, diagnostics: TypstDiagnostic[]) {
		super(message);
		this.name = 'TypstCompileError';
		this.diagnostics = diagnostics;
	}
}

export type CompileOptions = {
	assets?: TypstAssets;
	// Abort the caller's promise. The underlying worker job still runs to
	// completion (single-threaded WASM; no true interrupt), but its result is
	// dropped once it arrives.
	signal?: AbortSignal;
};

export type CompileResult = { svg: string; diagnostics: TypstDiagnostic[] };
export type ExportPdfResult = { pdf: Uint8Array; diagnostics: TypstDiagnostic[] };

export type TypstClient = {
	compile(
		sources: TypstSources,
		mainPath: string,
		options?: CompileOptions
	): Promise<CompileResult>;
	exportPdf(
		sources: TypstSources,
		mainPath: string,
		options?: CompileOptions
	): Promise<ExportPdfResult>;
	dispose(): void;
};

function abortError(): Error {
	// DOMException is available in modern browsers and in Node ≥17.
	return new DOMException('Typst job aborted', 'AbortError');
}

export function createTypstClient(): TypstClient {
	const worker = new TypstWorker();
	const pending = new Map<number, Pending>();
	let nextId = 0;
	let disposed = false;

	worker.addEventListener('message', (e: MessageEvent<TypstResponse>) => {
		const msg = e.data;
		const entry = pending.get(msg.id);
		if (!entry) return;
		pending.delete(msg.id);
		entry.detach();
		if (msg.ok) entry.resolve(msg);
		else entry.reject(new TypstCompileError(msg.error, msg.diagnostics));
	});

	function send(req: Omit<TypstRequest, 'id'>, signal?: AbortSignal): Promise<TypstResponse> {
		if (disposed) return Promise.reject(new Error('TypstClient is disposed'));
		if (signal?.aborted) return Promise.reject(abortError());

		return new Promise((resolve, reject) => {
			const id = nextId++;

			const onAbort = () => {
				const entry = pending.get(id);
				if (!entry) return;
				pending.delete(id);
				entry.detach();
				reject(abortError());
			};
			const detach = () => signal?.removeEventListener('abort', onAbort);
			signal?.addEventListener('abort', onAbort, { once: true });

			pending.set(id, { resolve, reject, detach });
			worker.postMessage({ ...req, id } as TypstRequest);
		});
	}

	return {
		async compile(sources, mainPath, options = {}) {
			const res = await send(
				{ type: 'compile', sources, mainPath, assets: options.assets },
				options.signal
			);
			if (!res.ok || res.type !== 'compile') {
				throw new Error(`unexpected response for compile: ${JSON.stringify(res)}`);
			}
			return { svg: res.svg, diagnostics: res.diagnostics };
		},
		async exportPdf(sources, mainPath, options = {}) {
			const res = await send(
				{ type: 'export-pdf', sources, mainPath, assets: options.assets },
				options.signal
			);
			if (!res.ok || res.type !== 'export-pdf') {
				throw new Error(`unexpected response for export-pdf: ${JSON.stringify(res)}`);
			}
			return { pdf: res.pdf, diagnostics: res.diagnostics };
		},
		dispose() {
			disposed = true;
			for (const entry of pending.values()) {
				entry.detach();
				entry.reject(new Error('TypstClient disposed before response'));
			}
			pending.clear();
			worker.terminate();
		}
	};
}
