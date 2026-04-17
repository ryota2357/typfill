/// <reference lib="webworker" />

import { createTypstCompiler, CompileFormatEnum } from '@myriaddreamin/typst.ts/compiler';
import { createTypstRenderer } from '@myriaddreamin/typst.ts/renderer';
import { loadFonts } from '@myriaddreamin/typst.ts/options.init';

import compilerWasmUrl from '@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url';
import rendererWasmUrl from '@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url';

import type { TypstRequest, TypstResponse } from './protocol.ts';

const fontUrl = '/fonts/HaranoAjiMincho-Regular.otf';

const scope = self as unknown as DedicatedWorkerGlobalScope;

const compiler = createTypstCompiler();
const renderer = createTypstRenderer();

const ready = (async () => {
	const fontBytes = new Uint8Array(await (await fetch(fontUrl)).arrayBuffer());
	await compiler.init({
		beforeBuild: [loadFonts([fontBytes])],
		getModule: () => compilerWasmUrl
	});
	await renderer.init({
		beforeBuild: [],
		getModule: () => rendererWasmUrl
	});
})();

function postOk(msg: TypstResponse, transfer: Transferable[] = []) {
	scope.postMessage(msg, transfer);
}

function loadSources(sources: Record<string, string>, mainPath: string) {
	for (const [path, content] of Object.entries(sources)) {
		compiler.addSource(path, content);
	}
	if (!(mainPath in sources)) {
		throw new Error(`mainPath ${mainPath} not present in sources`);
	}
}

scope.addEventListener('message', async (e: MessageEvent<TypstRequest>) => {
	const req = e.data;
	try {
		await ready;
		loadSources(req.sources, req.mainPath);

		if (req.type === 'compile') {
			const { result, diagnostics } = await compiler.compile({
				mainFilePath: req.mainPath,
				format: CompileFormatEnum.vector,
				diagnostics: 'full'
			});
			if (!result) {
				postOk({
					id: req.id,
					ok: false,
					error: 'compilation produced no artifact',
					diagnostics: diagnostics ?? []
				});
				return;
			}
			const svg = await renderer.renderSvg({ format: 'vector', artifactContent: result });
			postOk({ id: req.id, ok: true, type: 'compile', svg, diagnostics: diagnostics ?? [] });
			return;
		}

		if (req.type === 'export-pdf') {
			const { result, diagnostics } = await compiler.compile({
				mainFilePath: req.mainPath,
				format: CompileFormatEnum.pdf,
				diagnostics: 'full'
			});
			if (!result) {
				postOk({
					id: req.id,
					ok: false,
					error: 'pdf export produced no artifact',
					diagnostics: diagnostics ?? []
				});
				return;
			}
			postOk(
				{ id: req.id, ok: true, type: 'export-pdf', pdf: result, diagnostics: diagnostics ?? [] },
				[result.buffer]
			);
			return;
		}
	} catch (err) {
		postOk({
			id: (req as { id: number }).id,
			ok: false,
			error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
			diagnostics: []
		});
	}
});
