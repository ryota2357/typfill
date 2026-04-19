/// <reference lib="webworker" />

import {
  CompileFormatEnum,
  createTypstCompiler,
} from "@myriaddreamin/typst.ts/compiler";
import { loadFonts } from "@myriaddreamin/typst.ts/options.init";
import { createTypstRenderer } from "@myriaddreamin/typst.ts/renderer";
import rendererWasmUrl from "@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm?url";
import compilerWasmUrl from "@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm?url";

import {
  MAIN_TYP_PATH,
  type TypstAssets,
  type TypstRequest,
  type TypstResponse,
  type TypstSources,
} from "./protocol";

const fontUrl = "/fonts/HaranoAjiMincho-Regular.otf";

const scope = self as unknown as DedicatedWorkerGlobalScope;

const compiler = createTypstCompiler();
const renderer = createTypstRenderer();

const ready = (async () => {
  const fontBytes = new Uint8Array(await (await fetch(fontUrl)).arrayBuffer());
  await compiler.init({
    beforeBuild: [loadFonts([fontBytes])],
    getModule: () => compilerWasmUrl,
  });
  await renderer.init({
    beforeBuild: [],
    getModule: () => rendererWasmUrl,
  });
})();

// Paths of binary assets currently installed in the VFS via `mapShadow`. Each
// request replaces this set so stale entries do not leak across jobs.
const mappedAssetPaths = new Set<string>();

function post(msg: TypstResponse, transfer: Transferable[] = []) {
  scope.postMessage(msg, transfer);
}

function installSources(sources: TypstSources) {
  for (const [path, content] of Object.entries(sources)) {
    compiler.addSource(path, content);
  }
  if (!(MAIN_TYP_PATH in sources)) {
    throw new Error(`${MAIN_TYP_PATH} not present in sources`);
  }
}

function installAssets(assets: TypstAssets | undefined) {
  const next = new Set(Object.keys(assets ?? {}));
  for (const path of mappedAssetPaths) {
    if (!next.has(path)) {
      compiler.unmapShadow(path);
      mappedAssetPaths.delete(path);
    }
  }
  for (const [path, bytes] of Object.entries(assets ?? {})) {
    compiler.mapShadow(path, bytes);
    mappedAssetPaths.add(path);
  }
}

scope.addEventListener("message", async (e: MessageEvent<TypstRequest>) => {
  const req = e.data;
  try {
    await ready;
    installSources(req.sources);
    installAssets(req.assets);

    if (req.type === "compile") {
      const { result, diagnostics } = await compiler.compile({
        mainFilePath: MAIN_TYP_PATH,
        format: CompileFormatEnum.vector,
        diagnostics: "full",
      });
      if (!result) {
        post({
          id: req.id,
          ok: false,
          error: "compilation produced no artifact",
          diagnostics: diagnostics ?? [],
        });
        return;
      }
      const svg = await renderer.renderSvg({
        format: "vector",
        artifactContent: result,
      });
      post({
        id: req.id,
        ok: true,
        type: "compile",
        svg,
        diagnostics: diagnostics ?? [],
      });
      return;
    }

    if (req.type === "export-pdf") {
      const { result, diagnostics } = await compiler.compile({
        mainFilePath: MAIN_TYP_PATH,
        format: CompileFormatEnum.pdf,
        diagnostics: "full",
      });
      if (!result) {
        post({
          id: req.id,
          ok: false,
          error: "pdf export produced no artifact",
          diagnostics: diagnostics ?? [],
        });
        return;
      }
      post(
        {
          id: req.id,
          ok: true,
          type: "export-pdf",
          pdf: result,
          diagnostics: diagnostics ?? [],
        },
        [result.buffer],
      );
      return;
    }
  } catch (err) {
    post({
      id: (req as { id: number }).id,
      ok: false,
      error: err instanceof Error ? `${err.name}: ${err.message}` : String(err),
      diagnostics: [],
    });
  }
});
