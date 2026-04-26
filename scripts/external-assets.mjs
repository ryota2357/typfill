// Shared manifest of binary assets that ship via R2 instead of being bundled
// into the Cloudflare Workers static-assets payload. Keeping a single source
// of truth here prevents drift between the Vite build (which embeds the URLs
// via `define`) and the CI uploader (which puts the same files into R2 under
// the same content-hashed names).
//
// The Workers static-assets bundle has a 25 MiB per-file limit; the typst
// compiler wasm is ~28 MiB. Hosting these binaries on R2 sidesteps that limit
// and also keeps the Workers deploy small.

import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * @typedef {Object} AssetSource
 * @property {string} path Relative-to-repo-root path to the source file.
 * @property {string} name Stem of the published filename.
 * @property {string} ext Extension of the published filename.
 * @property {string} contentType Content-Type to set on R2 / dev responses.
 */

/**
 * @typedef {Object} ExternalAsset
 * @property {string} key Manifest key (e.g. "compilerWasm").
 * @property {string} absPath Absolute path to the source file.
 * @property {string} filename Content-hashed filename used as the R2 object key.
 * @property {string} contentType Content-Type to set on R2 / dev responses.
 */

// `path` is relative to the repo root. `name`/`ext` are joined with a content
// hash to form the R2 object key, e.g. `typst_ts_web_compiler_bg-<hash>.wasm`.
/** @type {Record<string, AssetSource>} */
const sources = {
  compilerWasm: {
    path: "node_modules/@myriaddreamin/typst-ts-web-compiler/pkg/typst_ts_web_compiler_bg.wasm",
    name: "typst_ts_web_compiler_bg",
    ext: "wasm",
    contentType: "application/wasm",
  },
  rendererWasm: {
    path: "node_modules/@myriaddreamin/typst-ts-renderer/pkg/typst_ts_renderer_bg.wasm",
    name: "typst_ts_renderer_bg",
    ext: "wasm",
    contentType: "application/wasm",
  },
  font: {
    path: "cdn-assets/HaranoAjiMincho-Regular.otf",
    name: "HaranoAjiMincho-Regular",
    ext: "otf",
    contentType: "font/otf",
  },
};

/**
 * @param {AssetSource} src
 * @returns {{ absPath: string, filename: string }}
 */
function hashFilename({ path, name, ext }) {
  const bytes = readFileSync(resolve(repoRoot, path));
  const hash = createHash("sha256").update(bytes).digest("hex").slice(0, 16);
  return {
    absPath: resolve(repoRoot, path),
    filename: `${name}-${hash}.${ext}`,
  };
}

/**
 * Build the manifest by hashing the current on-disk files. Called eagerly so
 * the result is a frozen object both consumers can iterate on.
 *
 * @returns {Record<string, ExternalAsset>}
 */
function buildManifest() {
  /** @type {Record<string, ExternalAsset>} */
  const out = {};
  for (const [key, src] of Object.entries(sources)) {
    const { absPath, filename } = hashFilename(src);
    out[key] = { key, absPath, filename, contentType: src.contentType };
  }
  return Object.freeze(out);
}

export const externalAssets = buildManifest();
