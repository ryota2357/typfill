# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Typfill is a SvelteKit + Tailwind app that runs Typst (WASM, Web Worker) entirely in the browser to generate PDFs from form-driven templates (Japanese 履歴書 / 請求書). It ships as a fully static SPA on Cloudflare Pages — no server runtime.

## Commands

```sh
pnpm dev            # Vite dev server
pnpm build          # production build → build/ (Cloudflare Pages, see wrangler.toml)
pnpm test           # vitest run, both projects; test:unit to watch; `pnpm vitest run <file>` for one
pnpm typecheck      # svelte-check, NOT tsc
pnpm check          # Biome lint+format check (read-only); check:write to fix
```

`pnpm` only — `npm` is not on PATH.

Vitest runs two projects (`vite.config.ts`): `*.svelte.spec.ts` → **client** (Playwright/Chromium), everything else `*.spec.ts` → **server** (node). Use `.svelte.spec.ts` only when a test mounts a component or needs a browser.

## Architecture

The data path, per template:

```
Form (Svelte 5 runes)  →  codegen.ts (data → main.typ string)  →  Worker (Typst WASM compile → SVG / PDF)
```

**Templates** (`src/lib/templates/<name>/`) — each has a fixed public surface that consumers reach via `import * as template from "$lib/templates/<name>"`:
- `index.ts` — the only public exports (`templateId`, `label`, `storageKey`, `serialize`/`deserialize`, `buildCompileInputs`, `EMPTY_PROPS`/`SAMPLE_PROPS`, `TemplateProps` type).
- `schema.ts` — `is*` predicates (`@core/unknownutil`); `TemplateProps = PredicateType<typeof isTemplateProps>` (single source, no parallel type+predicate).
- `codegen.ts` — builds the `main.typ` string from data.
- `compile.ts` — assembles `mainTyp` + `?raw`-imported `template/lib.typ` + binary assets into `CompileInputs`.
- `template/` — the actual Typst sources, a **git submodule** from `ryota2357/typst-<name>-template` (fresh clones need `git submodule update --init`). Edit `.typ` upstream; here you only bump the pointer (and `codegen.ts`/`schema.ts` if the call surface changed).

Adding a template touches: the submodule + the files above + `registry.ts` + a `src/routes/<name>/` page (a `+page.svelte` that calls `createTemplateState(template, fresh)` and renders section components from `src/routes/<name>/sections/`).

**Codec** (`src/lib/templates/codec.ts`) — one shared serializer for both localStorage autosave and share-URL fragments (JSON + lz-string + URL-safe base64). `createCodec` walks the data tree automatically; `ValueCodec`s cover non-JSON types (photo bytes), `sanitizeForShare` strips fields from share payloads (resume drops 写真).

**Typst worker** (`src/lib/typst/`) — `worker.ts` is the *only* code that touches `@myriaddreamin/typst.ts`. `worker-client.ts` wraps it in a Promise-based `TypstClient` (`compile()` → SVG, `exportPdf()` → Uint8Array), honoring `AbortSignal` + `timeoutMs`. On timeout the worker is terminated (WASM can't be interrupted mid-compile) and recreated lazily. Single-threaded → no COOP/COEP headers → plain static hosting works. Entry path is fixed at `MAIN_TYP_PATH`; templates supply its contents.

**External binary assets** (`src/lib/typst/` + `scripts/`) — the compiler/renderer WASM and font are too large for Cloudflare's 25 MiB per-file limit, so they live in an R2 bucket and the worker fetches them at runtime. `scripts/external-assets.mjs` is the shared manifest (content-hashed filenames) consumed by both `vite.config.ts` (injects `__*_URL__` defines) and `scripts/upload-assets.mjs` (CI uploader), so referenced URLs and uploaded keys can't drift. In dev a Vite middleware serves the same files locally, so contributors need no R2 access. Adding an asset = manifest entry + `__*_URL__` define + `declare const`/use in `worker.ts`.

**UI shell** —
- `components/TemplateEditor.svelte` — generic, template-agnostic frame: 2-column form/preview, mobile tabs, debounced localStorage autosave, share-dialog + share-URL import detection.
- `templates/state.svelte.ts` — `createTemplateState<T>` bundles the per-route lifecycle (load, decode share import, accept/cancel, reset). `.svelte.ts` is required for `$state`.
- `components/forms/` — shared form primitives (re-exported via `forms/index.ts`). Per-template `sections/` compose these and live under `src/routes/`, never in `lib/`.
- `typst/Preview.svelte` + `SandboxedSvg.svelte` — Preview orchestrates compile-debounce, diagnostics, PDF export; SandboxedSvg is the iframe boundary (see Security).

**Routing** — `src/routes/+layout.ts` sets `ssr = false; prerender = true` once for all routes (worker/WASM imports are browser-only). `adapter-static` with `fallback: "404.html"` (+ `not_found_handling = "404-page"` in `wrangler.toml`) prerenders every route to a servable file and serves a real 404 for unknown paths.

## Security boundary

User input becomes Typst source at compile time, and compiled output becomes rendered SVG — both are attack surfaces. Two layers contain them; preserve both.

**1. Embedding strings into `.typ` — `src/lib/typst/escape.ts` is the only sanctioned path.** Classify every new field and pick the helper, or it becomes a compile-time code-execution vector or a UX leak:
- `plainMarkupLit` — data-value fields (name, address, timeline entries…). Escapes *all* markup-significant chars so a stray `== 見出し` in a name doesn't render as a heading.
- `rawMarkupLit` — opt-in free-text fields whose form surface (`MarkupField`) promises Typst support. Emits `eval(…, mode: "markup")` — full markup incl. arbitrary compile-time code. **This is intended** for these fields; user input is opaque to the outer parser so it stays contained.
- `stringLit` — Typst `"…"` literals (VFS paths like `写真: "/vfs/photo.png"`).

Lengths go through the `LENGTH_PATTERN` whitelist in `resume/codegen.ts`.

**2. Rendering the SVG — `SandboxedSvg.svelte`'s `<iframe sandbox>` (no `allow-scripts`, no `allow-same-origin`).** `rawMarkupLit` lets Typst emit arbitrary SVG (script tags, `javascript:` links, foreignObject HTML), but the iframe neutralizes it and isolates it from the parent origin. Any new SVG-rendering path must keep this boundary or share-URL authors regain XSS.

## Conventions

- Domain field names are intentionally Japanese throughout schema/codegen/Typst params (`氏名`, `現住所`, `免許・資格`). Don't latinize them.
- Svelte 5 runes forced on (`svelte.config.js`): `$state`, `$derived`, `$effect`, `$props`.
- Path alias `$lib` → `src/lib`.
- Biome: 2-space indent, double quotes, semicolons, 80-col. `.svelte` runs under `experimentalFullSupportEnabled`; the `**/*.svelte` override disables `noCommaOperator` + `noUnusedFunctionParameters` (false positives on function bindings / snippet params) — fix those there, not with per-line `biome-ignore`.
- Comments document the *why* (constraints, security boundaries, non-obvious bugs); the code names the *what*.
