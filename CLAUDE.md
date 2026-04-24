# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Typfill is a SvelteKit + Tailwind app that runs Typst (WASM, Web Worker) entirely in the browser to generate PDFs from form-driven templates (Japanese 履歴書 / 請求書). It deploys as a fully static SPA on Cloudflare Pages — no server runtime.

## Commands

Package manager is **pnpm** (npm is not on PATH).

- `pnpm dev` — Vite dev server.
- `pnpm build` — production build (output: `build/`, consumed by Cloudflare Pages via `wrangler.toml`).
- `pnpm typecheck` — `svelte-check`. Prefer this for verification: `pnpm check` (biome) has a parser bug on `・` identifiers (e.g. `免許・資格`).
- `pnpm test` — vitest (both browser + node projects, single run). `pnpm test:unit` for watch.
- `pnpm check:write` — biome format & lint fix (use sparingly, see typecheck note above).

Single test: `pnpm vitest run path/to/file.spec.ts` (or `.svelte.spec.ts` for the browser project).

### Test file conventions

Vitest runs two projects (`vite.config.ts`):
- `*.svelte.spec.ts` / `*.svelte.test.ts` → **client** project (Playwright/Chromium, headless).
- `*.spec.ts` / `*.test.ts` → **server** project (node environment).

Place `.svelte.spec.ts` only when the test mounts a component or needs a browser; pure logic stays `.spec.ts`.

## Architecture

### Three-layer pipeline

```
Form (Svelte 5 runes)  →  codegen.ts (TS → main.typ string)  →  Worker (Typst WASM compile + render)
```

Each template lives in `src/lib/templates/<name>/` with a stable public surface:

- `index.ts` — only public exports: `templateId`, `label`, `storageKey`, `serialize`/`deserialize` (from `createCodec`), `buildCompileInputs`, `EMPTY_FIELDS`/`SAMPLE_FIELDS`, plus `Fields` type. Consumers always do `import * as template from "$lib/templates/<name>"`.
- `schema.ts` — `is*` predicates via `@core/unknownutil`; `Fields` type is `PredicateType<typeof isFields>` (no parallel type/predicate definitions).
- `codegen.ts` — builds `main.typ` from data.
- `compile.ts` — wires the per-call generated `mainTyp` together with `?raw`-imported `template/lib.typ` and any binary assets into `CompileInputs`.
- `template/*.typ` — the actual Typst sources.

Adding a new template = add a directory matching this shape, append it to `src/lib/templates/registry.ts`, and add a `src/routes/<name>/` page that imports it and renders `<TemplateEditor>`.

### Codec (`src/lib/templates/codec.ts`)

Single shared serializer used for both `localStorage` autosave and share-URL fragments. `createCodec({ schemaVersion, isFields, valueCodecs?, sanitizeForShare? })` walks the data tree automatically — templates do not write per-shape `toWire`/`fromWire`. JSON + lz-string + URL-safe base64. `ValueCodec`s handle non-JSON runtime types (`UINT8ARRAY_CODEC` for photo bytes). `sanitizeForShare` lets a template strip fields from share payloads (resume strips 写真).

### Typst worker (`src/lib/typst/`)

`worker.ts` is the only place that touches `@myriaddreamin/typst.ts`. `worker-client.ts` exposes a `Promise`-based `TypstClient` with `compile()` (SVG) and `exportPdf()` (Uint8Array). Both honor `AbortSignal` (the WASM job still runs to completion; the result is dropped) and a `timeoutMs` option. On timeout, the worker is `terminate()`-ed because Typst WASM cannot be interrupted mid-compile; a fresh worker is created lazily on the next request. Defaults: 10s for `compile`, 20s for `exportPdf`. Each request fully replaces VFS sources and binary assets — no leak across jobs. The fixed entry path is `MAIN_TYP_PATH = "/main.typ"`; templates supply its contents via `CompileInputs.mainTyp`.

Single-threaded — no COOP/COEP headers required, which is what lets the app deploy to plain static hosting.

### Preview (`src/lib/typst/Preview.svelte`)

Typst SVG output is inlined via `{@html}`. TODO: sanitize — now that `rawMarkupLit` fields accept arbitrary Typst from end users (and share URLs), the output can carry `javascript:` link targets or HTML-in-`<foreignObject>` that reach the DOM unfiltered.

### Editor shell (`src/lib/components/TemplateEditor.svelte`)

Generic `<TemplateEditor>` is the shared frame: 2-column form/preview layout, mobile tab switch, debounced 500 ms `localStorage` autosave keyed by `template.storageKey`, share-URL hash detection (`parseShareFragment`), and the share dialog. Each route passes its template module + form snippet; the editor stays template-agnostic.

### Routing

`src/routes/<template>/+page.ts` sets `ssr = false; prerender = true` because the worker client + WASM imports touch browser-only APIs at module scope. `adapter-static` with `fallback: "index.html"` gives every route a directly-servable file plus a SPA catch-all.

## Security boundary

`src/lib/typst/escape.ts` is the **only** sanctioned path for embedding user strings into generated `.typ`. Pick the helper based on the field's role:

- `plainMarkupLit(s)` — data-value fields (name, address, phone, title, timeline entries, …). Treats the input as literal text: every Typst markup-significant character is escaped, including `=`, `-`, `+`, `/`, `~` so a stray `== 見出し` in a name field doesn't render as a heading.
- `rawMarkupLit(s)` — opt-in free-text fields whose form surface promises Typst support (`MarkupTextarea`). Emits `eval(string, mode: "markup")` so the user gets full Typst markup including `#link(…)[…]`, `#show`, math, raw blocks. The string is opaque to the outer parser, so unbalanced brackets/backticks in user input stay contained. This permits arbitrary Typst code execution at compile time — that is the intended capability for these fields.
- `stringLit(s)` — Typst `"..."` string literals (VFS paths such as `写真: "/vfs/photo.png"`).

Lengths go through the `LENGTH_PATTERN` whitelist in `resume/codegen.ts`. Adding a new field means classifying it (data-value vs markup-opt-in) and picking the matching helper, or it becomes a code-execution vector at compile time or a UX leak where formatting accidentally renders.

`rawMarkupLit`'s security model relies on the Typst WASM compiler being sandboxed — no file-system or network access beyond the controlled VFS. Preview still inlines the compiled SVG unsanitized (see TODO in `Preview.svelte`), which remains an open XSS vector for content authored by third parties via share URLs; sanitize before treating that path as closed.

## Conventions

- Domain field names are intentionally written in Japanese throughout schema / codegen / Typst params (e.g. `氏名`, `現住所`, `免許・資格`). Don't latinize them.
- Svelte 5 **runes are forced on** for project files (`svelte.config.js`); use `$state`, `$derived`, `$effect`, `$props`.
- Path alias `$lib` → `src/lib`. Other aliases via SvelteKit config.
- Biome formats with 2-space indent, double quotes, semicolons, 80-col width.
- Comments document the *why* (constraints, security boundaries, non-obvious bugs); the code names the *what*.
