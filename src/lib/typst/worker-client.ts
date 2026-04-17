import TypstWorker from './worker.ts?worker';
import type { TypstRequest, TypstResponse } from './protocol.ts';

type Pending = {
	resolve: (value: TypstResponse) => void;
	reject: (reason: Error) => void;
};

export type TypstClient = {
	compile(
		sources: Record<string, string>,
		mainPath: string
	): Promise<{ svg: string; diagnostics: unknown[] }>;
	exportPdf(
		sources: Record<string, string>,
		mainPath: string
	): Promise<{ pdf: Uint8Array; diagnostics: unknown[] }>;
	dispose(): void;
};

export function createTypstClient(): TypstClient {
	const worker = new TypstWorker();
	const pending = new Map<number, Pending>();
	let nextId = 0;

	worker.addEventListener('message', (e: MessageEvent<TypstResponse>) => {
		const msg = e.data;
		const entry = pending.get(msg.id);
		if (!entry) return;
		pending.delete(msg.id);
		if (msg.ok) entry.resolve(msg);
		else entry.reject(new Error(msg.error));
	});

	function send(req: Omit<TypstRequest, 'id'>): Promise<TypstResponse> {
		return new Promise((resolve, reject) => {
			const id = nextId++;
			pending.set(id, { resolve, reject });
			worker.postMessage({ ...req, id } as TypstRequest);
		});
	}

	return {
		async compile(sources, mainPath) {
			const res = await send({ type: 'compile', sources, mainPath });
			if (!res.ok || res.type !== 'compile') throw new Error('unexpected response');
			return { svg: res.svg, diagnostics: res.diagnostics };
		},
		async exportPdf(sources, mainPath) {
			const res = await send({ type: 'export-pdf', sources, mainPath });
			if (!res.ok || res.type !== 'export-pdf') throw new Error('unexpected response');
			return { pdf: res.pdf, diagnostics: res.diagnostics };
		},
		dispose() {
			worker.terminate();
		}
	};
}
