# Concept & Plan: pdf-by-typst

A consolidated design doc built from `CHAT_LOG.md` (the original brainstorming with Claude Sonnet & Opus) plus a survey of the target Typst templates and the current project skeleton. This is the working reference for subsequent development; `CHAT_LOG.md` remains as raw history.

---

## 1. Concept

A **serverless static site** that turns Typst templates into PDFs entirely in the browser.

- User picks a template (資料書 / 請求書 / …), fills out a form, and sees a live preview.
- A WASM build of Typst (`typst.ts`) compiles the document in a Web Worker.
- Split view on desktop, tab switch on mobile; one-click PDF download.
- No backend: hostable as a static site.

### Scope

- **v1 ships resume (履歴書) only.** The invoice template and any future ones come after the resume flow is solid.
- **But the architecture is designed for multiple templates from day one** — per-template subdirectories, generic Typst runtime, template-agnostic worker. See §4.1.
- **Non-goals (for v1):** auth/accounts, SSR, template editing inside the app, sharing arbitrary assets other than the structured form data.

### Persistence & sharing model

- **Primary storage:** LocalStorage (auto-saved, debounced). Keys are **namespaced per template** (e.g. `pdf-by-typst.resume.v1`, `pdf-by-typst.invoice.v1`).
- **Sharing:** explicit "Share" button compresses JSON with `lz-string`, Base64-encodes it, and puts it in a **URL fragment** (`#t=resume&data=…`) — not a query string — so the PII never reaches hosting access logs. The template ID travels in the fragment too.
- **Receiving a shared URL:** show an import confirmation modal, then call `history.replaceState` to strip the fragment from the browser URL bar.
- If LocalStorage already has data for that template when importing, prompt the user to overwrite or discard.
- **Photo / image fields are excluded from the share payload by default**, with an explicit "include image" toggle. The share-button UI must surface a message explaining this so the recipient isn't confused by a missing photo.

---

## 2. Target Templates

### 2.1 Resume (`~/ghq/github.com/ryota2357/typst-resume-template`)

Two-file layout: `lib.typ` defines the `resume` function; `main.typ` imports it and applies it via `#show: resume.with(...)`. A4 fixed, JIS / MHLW-compliant. No external Typst packages.

Data-input contract — **named function parameters** (not `sys.inputs`):

| Field                        | Type                                                         | Notes                                                   |
| ---------------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| `日付`                       | `datetime` or `auto`                                         | `auto` → `datetime.today()`                             |
| `氏名`, `氏名ふりがな`       | `([last], [first])` tuple                                    |                                                         |
| `生年月日`                   | `datetime(y, m, d)`                                          | age auto-calculated                                     |
| `性別`                       | markup                                                       | e.g. `[男]`                                             |
| `写真`                       | image or `none`                                              |                                                         |
| `現住所`, `連絡先`           | record `(郵便番号, 住所, 住所ふりがな, 電話, E-mail)`        |                                                         |
| `学歴`, `職歴`, `免許・資格` | **variable-length array** of `(year, month, content)` tuples |                                                         |
| `志望動機`, `本人希望記入欄` | markup (multi-line)                                          |                                                         |
| `params`                     | layout tuning record                                         | e.g. `学歴・職歴の最小行数: 22`, `志望動機の高さ: 22em` |

Helpers / quirks:

- `元号()` converts Gregorian year → Japanese era.
- `layout()`-based auto-shrink for long e-mail strings.
- Empty `職歴` renders as "なし".
- `写真` uses Typst's `image()` — in the browser we have to supply the file bytes to the Typst VFS rather than a path.

### 2.2 Invoice (`~/ghq/github.com/ryota2357/typst-invoice-template`)

**Same architectural pattern as the resume.** Two-file layout (`lib.typ` + `main.typ`), `#show: invoice.with(...)`, no external Typst packages, same font (`Harano Aji Mincho`). Data-input contract — named function parameters:

| Field                   | Type                                                        | Notes               |
| ----------------------- | ----------------------------------------------------------- | ------------------- |
| `title`                 | markup                                                      | default `[請求書]`  |
| `date`                  | `datetime` or `auto`                                        |                     |
| `invoice-number-series` | int                                                         |                     |
| `due-date`              | `datetime`                                                  |                     |
| `recipient`             | record `(name, postal-ccode, address)`                      | 宛先                |
| `issuer`                | record `(name, postal-ccode, address)`                      | 発行元              |
| `account`               | record `(bank, branch, type, number, holder)`               | 振込先              |
| `items`                 | **variable-length array** of `(name, amount, unit?, price)` | 明細                |
| `min-item-rows`         | int                                                         | default 8           |
| `tax-rate`              | float                                                       | default `0.1` (10%) |
| `body`                  | markup                                                      | 備考                |

Quirks:

- Subtotal / tax / total are computed **inside Typst** (`items.map(it => it.price * it.amount).sum() …`), so the form never needs to pre-calculate them.
- `format-number()` helper for 3-digit grouping.
- No image fields currently (no logo/印影 support).

### 2.3 What the two templates have in common

This commonality is what makes the per-template abstraction cheap:

- `lib.typ` + `main.typ` split, activated via `#show: <fn>.with(...)`.
- Named function parameters; no `sys.inputs`; no external packages.
- Japanese-language, A4, `Harano Aji Mincho` regular only.
- Variable-length tuple arrays for the main repeating section (学歴/職歴 vs. items).
- Optional layout-tuning record parameter.

---

## 3. Current Project Environment

Located at `/Users/ryota2357/ghq/github.com/ryota2357/pdf-by-typst`.

- **Framework:** SvelteKit 2.57 + **Svelte 5.55** (runes mode).
- **Build tool:** Vite 8.
- **Styling:** Tailwind CSS 4.
- **Language:** TypeScript 6 (strict).
- **Tests:** Vitest 4 with Playwright browser runner already wired.
- **Formatter:** Prettier 3.8 (with `prettier-plugin-svelte`, `prettier-plugin-tailwindcss`). No ESLint.
- **Package manager:** pnpm (via `pnpm-lock.yaml`).
- **Dev environment:** Nix flake (`flake.nix`, `.envrc` with `use flake`).
- **Source:** resume form + preview + share link flow under `/resume`; landing page lists templates from the registry. Phases 0–4 shipped (see §5).
- **Adapter:** `@sveltejs/adapter-auto` (needs to be pinned to `@sveltejs/adapter-static` before deployment — Phase 5).
- **Not yet present:** Service Worker, `_headers`, CI config. `typst.ts`, `lz-string`, Web Worker, PDF preview, LocalStorage, share-link encoding are all wired.

---

## 4. Key Technical Decisions

### 4.1 Directory layout — generic runtime + per-template modules

```
src/
├── lib/
│   ├── typst/                     # template-agnostic
│   │   ├── worker.ts              # Web Worker entry
│   │   ├── worker-client.ts       # main-thread wrapper
│   │   ├── escape.ts              # escapeTypst(value) utility
│   │   └── font-loader.ts         # Harano Aji Mincho → VFS bytes
│   ├── templates/
│   │   ├── registry.ts            # { resume, invoice, … }
│   │   ├── types.ts               # shared TemplateModule<T> interface
│   │   ├── resume/
│   │   │   ├── types.ts           # ResumeData
│   │   │   ├── codegen.ts         # buildMainTyp(data): string
│   │   │   ├── defaults.ts        # initial form values
│   │   │   ├── schema.ts          # zod/valibot validation + share-payload guards
│   │   │   ├── template/          # copied from typst-resume-template (lib.typ, main.typ)
│   │   │   └── ui/                # <BasicInfoForm />, <EducationList />, etc.
│   │   └── invoice/               # same shape, empty skeleton for v1
│   └── share/                     # lz-string + fragment encode/decode
└── routes/
    ├── +layout.svelte
    ├── +page.svelte               # landing / template picker
    ├── resume/+page.svelte        # v1 target
    └── invoice/+page.svelte       # stubbed in v1 (“coming soon”)
```

Key constraints this layout enforces:

- **Templates are copied in, not submoduled.** On a template release we manually copy the new `lib.typ` / `main.typ` and update `codegen.ts` + `types.ts` in the same PR.
- **A `TemplateModule<T>` interface** (id, display name, default data, `buildMainTyp(data): string`, root form component, share-payload sanitizer) — everything the generic runtime needs. Routes are template-aware but the worker is not.
- **Deliberately thin abstraction.** We don't try to auto-derive forms from the Typst signature, we don't build a generic field editor. Each template writes its own Svelte form. v1 only implements the resume side; the invoice directory exists as a placeholder so we don't have to restructure later.

### 4.2 Data injection: dynamic `.typ` generation

Both templates take their data through **named function parameters that include variable-length arrays of tuples**. `sys.inputs` only carries flat string key/values and cannot represent these. So:

- Each template's `codegen.ts` builds a small `main.typ` string at compile time, importing `lib.typ` and calling the template function with the user's data serialized as Typst literals.
- `escapeTypst()` (in the shared runtime) handles `#`, `<`, `>`, backtick, `@`, `$`, `*`, `_`, `\`, and balanced brackets. Every user-input site must go through it. This is a security boundary, not cosmetics — covered by focused Vitest tests.
- Dates are emitted as `datetime(year: …, month: …, day: …)`.
- For resume, the photo is loaded into the Typst VFS as bytes; the generated `.typ` references the in-VFS path.

### 4.3 Preview pipeline

Chat-log open question — SVG vs pdf.js vs iframe blob. Decision deferred to Phase 0; the default expectation is:

- **Preview:** SVG emitted by `typst.ts`, one `<div>` per page, with manual pagination / scroll. Debounced 300–500 ms so fast typing doesn't thrash the worker.
- **Download:** on-demand PDF from the same Worker.

pdf.js is the fallback if SVG page layout or mobile pinch-zoom is unsatisfactory.

### 4.4 Fonts

Both templates use `Harano Aji Mincho` only, so we bundle one font file (regular weight). **Licensing is SIL OFL 1.1 — redistribution as an app asset is permitted.** No subsetting because user input is open-ended.

Plan:

1. Commit `Harano Aji Mincho` regular into `static/fonts/`.
2. Fetch once; cache via Service Worker.
3. Feed bytes into the Typst VFS at worker init time.

### 4.5 Compilation in a Web Worker

- Main thread never touches Typst.
- Worker protocol: `{ type: 'compile', typ: string, assets: Record<string, Uint8Array> } → { svg: string[], warnings: Diagnostic[] }` and `{ type: 'export-pdf', … } → { pdf: Uint8Array }`.
- Debounce input on the main thread; the worker itself just compiles what it's told, and cancels any superseded in-flight job.

### 4.6 Hosting — Cloudflare Pages

Decided. We go Cloudflare Pages, not GitHub Pages, so we can ship a `_headers` file with COOP/COEP if Phase 0 determines that multithreaded WASM (requires `SharedArrayBuffer`) improves compilation speed enough to be worth it. Adapter swap to `@sveltejs/adapter-static`.

---

## 5. Development Plan

Phases mirror the chat log but are rewritten with concrete exit criteria. v1 = Phases 0–5 for the resume. Invoice comes after.

### Phase 0 — Feasibility spike (mandatory first) — DONE

**Exit criteria:** we can write a hard-coded `.typ` string in the browser, compile it in a Web Worker, render its SVG into the DOM, and download the same document as a PDF.

- [x] Add `typst.ts` to the project; confirm which package exports we need (`@myriaddreamin/typst.ts` or current equivalent).
- [x] Create `src/lib/typst/worker.ts` with a minimal compile/export API.
- [x] Load `Harano Aji Mincho` from `static/fonts/` and inject into the Typst VFS.
- [x] Copy `typst-resume-template` into `src/lib/templates/resume/template/` and compile `main.typ` from this copy.
- [x] Decide preview rendering: SVG (preferred) vs pdf.js vs iframe blob. ~~Measure on a real mobile browser.~~ → mobile measurement deferred to Phase 3.
- [x] Decide whether multithreaded `typst.ts` is needed. If yes, commit to `_headers` for COOP/COEP.

#### Phase 0 results

**Packages installed** (all pinned to `0.7.0-rc2` — current `latest` dist-tag; stable `0.7.0` not yet released):

- `@myriaddreamin/typst.ts` (JS API)
- `@myriaddreamin/typst-ts-web-compiler` (compiler WASM, peer dep)
- `@myriaddreamin/typst-ts-renderer` (renderer WASM, peer dep)

**Files created**:

```
static/fonts/HaranoAjiMincho-Regular.otf       # served at /fonts/…
src/lib/templates/resume/template/
  ├── lib.typ                                  # copied from typst-resume-template
  └── main.typ
src/lib/typst/
  ├── protocol.ts                              # TypstRequest / TypstResponse message types
  ├── worker.ts                                # Web Worker: init compiler+renderer, handle {compile, export-pdf}
  └── worker-client.ts                         # main-thread wrapper, uses `?worker` import
src/routes/phase0/
  ├── +page.ts                                 # `ssr = false; prerender = false;`
  └── +page.svelte                             # spike UI, hard-coded sources, buttons for recompile / PDF download
```

**Decisions**:

- **Preview = SVG.** Compile with `CompileFormatEnum.vector`, pass the artifact `Uint8Array` to `renderer.renderSvg({ format: 'vector', artifactContent })`, inject the returned string via `{@html svg}`. Works cleanly for the resume (single A4 page, ~280 KB SVG). pdf.js / iframe-blob stays as a fallback if Phase 3 mobile testing surfaces issues.
- **Single-threaded WASM.** `typst.ts@0.7.0-rc2` does not use `SharedArrayBuffer`; no COOP/COEP required. Drop the `_headers` line item from Phase 5 unless a future upstream change reintroduces threading.
- **WASM URL strategy.** `?url` imports against `node_modules/@myriaddreamin/typst-ts-{web-compiler,renderer}/pkg/*.wasm` inside the worker. Vite bundles and hashes them, so no manual copy into `static/`.
- **SSR.** `/phase0` has `ssr = false` because the worker-client imports WASM URLs at module scope. Subsequent template routes (`/resume`, `/invoice`) will need the same.

**Known caveats (carry into Phase 1+)**:

- WASM init logs `using deprecated parameters for the initialization function; pass a single object instead` twice at startup. Originates inside `typst.ts`'s wasm-bindgen shim (`module.default(bin)` positional arg); non-blocking, do not try to silence locally.
- After the shared type errors: `.ts` extensions in non-relative imports (e.g. `$lib/typst/worker-client.ts`) break `svelte-check` because `rewriteRelativeImportExtensions` only rewrites relative paths. Drop the extension for `$lib/...` imports.
- `?worker` import of `./worker.ts` works, but the worker file must not import anything that assumes `window` (e.g. don't pull from `@myriaddreamin/typst.ts/main` — it touches `window`). Use the `/compiler`, `/renderer`, `/options.init` subpath exports instead.
- Two source files (`/main.typ`, `/lib.typ`) are registered via `compiler.addSource(path, content)` before each `compile()`; no `compiler.reset()` call, so font state is preserved across messages. If we ever need to clear sources, do it via a new compiler instance rather than `reset()` (which also drops fonts).

**Verification**: headless Chromium via the project's Playwright hit `/phase0`, saw `status: ready`, confirmed one `<svg>` rendered, clicked "Download PDF" and received an 89 KB `%PDF-…` file. `pnpm run check` is clean.

This phase gated everything else; Worker I/O and preview component API are derived from what works here.

### Phase 1 — Core engine + template abstraction — DONE

- [x] `src/lib/typst/escape.ts` — `escapeMarkup` / `escapeString` plus `markupLit` / `stringLit` wrappers, with exhaustive Vitest coverage of every special character listed in §4.2.
- [x] `src/lib/typst/worker.ts` / `worker-client.ts` — finalize message protocol (named `TypstRequest` / `TypstResponse` / `TypstDiagnostic`, optional binary `assets`), error surfacing, cancellation.
- [x] `src/lib/templates/types.ts` — `TemplateModule<T>` interface (id, label, enabled, defaults, sources, mainPath, `buildMainTyp`, `FormComponent`, `sanitizeForShare`) plus a `buildCompileSources` helper.
- [x] `src/lib/templates/registry.ts` — registers the resume module (enabled) and an invoice stub (disabled; `buildMainTyp` throws until Phase 6).
- [x] `src/lib/templates/resume/types.ts` — `ResumeData` with Japanese-keyed fields mirroring §2.1.
- [x] `src/lib/templates/resume/codegen.ts` — `buildMainTyp(data: ResumeData): string`. Round-trip validated by structural unit tests plus a browser-project test that compiles a sample through the worker and asserts no error diagnostics.

#### Phase 1 results

**Files added / changed**:

```
src/lib/typst/
  ├── escape.ts               # escapeMarkup / escapeString / markupLit / stringLit
  ├── escape.spec.ts
  ├── protocol.ts             # extended: TypstAssets, TypstDiagnostic, typed responses
  ├── worker.ts               # now handles binary VFS via mapShadow / unmapShadow
  └── worker-client.ts        # AbortSignal support, typed diagnostics, dispose drains pending
src/lib/templates/
  ├── types.ts                # TemplateModule<T> + buildCompileSources helper
  ├── registry.ts             # resume (enabled) + invoice (disabled stub)
  └── resume/
      ├── types.ts            # ResumeData with Japanese field names
      ├── codegen.ts          # buildMainTyp with length-literal whitelist
      ├── defaults.ts         # RESUME_SAMPLE_DATA + RESUME_EMPTY_DATA fixtures
      ├── module.ts           # TemplateModule<ResumeData> composition
      ├── codegen.spec.ts     # structural tests (server project)
      └── codegen.svelte.spec.ts  # browser compile-success smoke test
```

**Design decisions locked in**:

- **`ResumeData` uses Japanese TypeScript identifiers** (`氏名`, `学歴`, `params.志望動機の高さ`) for 1:1 mapping with the upstream template. TS Unicode identifiers work fine through Prettier and `svelte-check`.
- **Two escape helpers, not one.** `escapeMarkup` for content blocks (`[...]`), `escapeString` for string literals (`"..."`). The spec listed one function, but the resume template uses both contexts (e.g. `image("vfs/path")`). `markupLit` / `stringLit` wrap with delimiters so callers can't forget the delimiters and accidentally drop the boundary.
- **Cancellation is client-side only.** `typst.ts@0.7.0-rc2` has no `AbortSignal` hook on `compile()` and no in-process cancellation token exposed on the main compile API. So `worker-client.compile({ signal })` rejects the caller's promise on abort and drops the late response when it arrives; the worker still runs the superseded job to completion. A future upstream change could let us cancel the WASM job itself; keep the current contract stable in either case.
- **Binary VFS uses `compiler.mapShadow(path, bytes)` / `unmapShadow(path)`** (Explore agent confirmed). Each request replaces the set; stale entries from previous jobs are explicitly unmapped. We do **not** call `compiler.reset()` — the Phase 0 note about it dropping loaded fonts was verified against `typst.ts/dist/esm/compiler.d.mts`.
- **`ResumeParams` length fields (`志望動機の高さ` etc.) go through a whitelist regex** (`^\d+(\.\d+)?(em|pt|mm|cm|in|%)$`) before emission. Length literals are the only non-escaped tokens in `buildMainTyp`'s output, so they get their own boundary. A code-injection attempt (`"22em); #sys.exit() //"`) is covered by `codegen.spec.ts`.
- **Round-trip test scope.** Structural unit tests (17 cases) cover every `buildMainTyp` field plus escaping/validation. One browser test compiles `RESUME_SAMPLE_DATA` through the worker and asserts no error diagnostics — that is the "actual compile" half of the spec. A byte-equal SVG/PDF diff against the upstream `main.typ` is deferred to Phase 2: handwriting `ResumeData` to match the upstream markup-rich 志望動機 doesn't actually increase confidence; the real round trip will come from form defaults when the UI lands.

**Known caveats (carry into Phase 2+)**:

- First vitest run after a clean `node_modules` emits a one-time "Vite unexpectedly reloaded a test" warning while it optimizes the `@myriaddreamin/typst.ts/*` entries. It goes away on subsequent runs. If it ever flakes a test, add those entries to `optimizeDeps.include` in `vite.config.ts`.
- `resumeModule.FormComponent` is currently `null` — Phase 2 sets it to the real root form. Registry consumers must tolerate `null` until then (see `enabled` flag).
- The `#import "./lib.typ"` path in generated `main.typ` is still relative, matching the Phase 0 VFS layout (`/main.typ`, `/lib.typ`). If we ever move the main file to a subdirectory, update `mainPath` and codegen in lockstep.

**Verification**: `pnpm run check` → 0 errors / 0 warnings. `pnpm run test:unit --run` → 5 files, 52 tests passed (server project covers escape + codegen structural; chromium browser project covers the worker smoke test in ~1.3s once WASM warms up).

### Phase 2 — Resume form UI — DONE

- [x] Svelte 5 runes store (`src/lib/templates/resume/state.svelte.ts`) holding `ResumeData` via `$state`, with `$derived` for preview input.
- [x] Field components under `src/lib/templates/resume/ui/` covering 基本情報, 現住所, 連絡先, 学歴, 職歴, 免許・資格, 志望動機, 本人希望記入欄. Repeated patterns (現住所/連絡先, 学歴/職歴/免許・資格) collapsed into shared `AddressForm` / `TimelineForm` components rather than duplicated per section.
- [x] `学歴 / 職歴 / 免許・資格` are add/remove/reorder variable-length lists (in-place `push` / `splice` / `moveItem`).
- [x] Photo upload: `<input type="file">` → canvas resize (max 600px long-side) → JPEG (q=0.85) bytes embedded in `ResumeData.写真.bytes`. **Interactive crop UI is deferred** — the resize/compress alone is enough to keep the SVG fast and to avoid huge LocalStorage / share payloads later.
- [x] Tailwind mobile-first styling — single column on mobile, side-by-side `md:grid-cols-2` (form left, preview right) on tablet+. Sticky-positioned preview column. Phase 3 will polish the layout (resizable divider on desktop, tab switcher on mobile).
- [x] Debounced reactive pipeline: store mutation → store's `$derived` `compileInputs` → `<Preview>` `$effect` → 400 ms debounce → `TypstClient.compile` (in-flight job aborted on superseding edit) → SVG into preview.

#### Phase 2 results

**Files added / changed**:

```
src/lib/templates/
  ├── types.ts                       # added optional extractAssets() + buildCompileAssets() helper
  └── resume/
      ├── types.ts                   # ResumePhoto now carries Uint8Array `bytes`
      ├── module.ts                  # wired ResumeForm + extractAssets
      ├── state.svelte.ts            # ResumeStore class ($state data + $derived compileInputs)
      │                              #   + setResumePhoto / clearResumePhoto / newTimelineEntry / moveItem helpers
      ├── state.spec.ts              # 8 unit tests for the helpers
      └── ui/
          ├── ResumeForm.svelte      # top-level composition; assigned to resumeModule.FormComponent
          ├── BasicInfoForm.svelte   # 氏名/ふりがな/生年月日/性別/写真/作成日付
          ├── AddressForm.svelte     # generic — used for 現住所 and 連絡先
          ├── TimelineForm.svelte    # generic — used for 学歴/職歴/免許・資格 (add/remove/up/down)
          ├── MarkupTextarea.svelte  # 志望動機 / 本人希望記入欄
          └── AdvancedParamsForm.svelte # params, surfaced in a collapsed <details>
src/lib/typst/
  └── Preview.svelte                 # template-agnostic preview: lazy worker, debounced compile, in-flight abort, SVG render, PDF download
src/routes/
  ├── +page.svelte                   # landing page — lists enabled templates from the registry, marks disabled ones as "準備中"
  ├── resume/+page.ts                # ssr=false, prerender=false (worker imports browser-only WASM URLs)
  └── resume/+page.svelte            # /resume route: form + preview, mobile-first responsive layout
```

Removed:

```
src/routes/phase0/                   # Phase 0 spike, superseded by /resume
```

**Design decisions locked in**:

- **`ResumePhoto.bytes: Uint8Array` lives inside `ResumeData`** (not in a side store). Keeps the `Component<{ data: T }>` form interface single-prop and lets a future LocalStorage layer persist the photo with the rest of the resume. `sanitizeForShare` already strips the entire `写真` field, so bytes never leak into a share link. Phase 4 will need a base64 boundary at the LocalStorage edge — Uint8Array doesn't survive `JSON.stringify`.
- **Two new TemplateModule pieces**: optional `extractAssets(data)` for binary VFS entries, and a `buildCompileAssets()` helper that pairs with the existing `buildCompileSources()`. Templates with text-only inputs (e.g. invoice) can omit `extractAssets`; the helper returns `{}` in that case. Photo VFS path is a fixed `/assets/photo.jpg`.
- **Generic shared components instead of one-component-per-field**. The plan listed 8 sections; in practice 現住所 and 連絡先 share the `Contact` shape, and 学歴/職歴/免許・資格 share the `TimelineEntry[]` shape. Having `AddressForm` and `TimelineForm` parameterized by `label` collapses 5 components into 2 with no loss of expressiveness.
- **Debounce + abort live in `<Preview>`, not in the store.** The store's `$derived` `compileInputs` invalidates synchronously on every keystroke (cheap — just rebuilds the source string). `<Preview>` debounces 400 ms before sending to the worker and aborts any in-flight superseded job via `AbortController`. Per Phase 1's note, abort only resolves the caller's promise; the WASM job still runs to completion, but its late SVG is dropped. This split keeps the store template-agnostic and keeps timing knobs in the preview.
- **`<Preview>` lives at `src/lib/typst/Preview.svelte`** (not under `templates/resume/`) and takes a generic `CompileInputs` prop. Reusable as-is for the invoice template in Phase 6.
- **Photo pipeline is resize+compress only, no crop UI.** `createImageBitmap()` → canvas → `toBlob('image/jpeg', 0.85)`. No third-party dependency. A cropping UI is deferred to a later phase if user feedback demands one.
- **`日付` is a radio toggle** (`本日（自動）` / `指定する`). Manual mode reveals an `<input type="date">`. Local UI state for the toggle is initialized from `data.日付` once via `untrack(() => …)` to make the "snapshot, don't subscribe" intent explicit and to silence Svelte's `state_referenced_locally` warning. A future Phase 4 LocalStorage import that overwrites `data.日付` will not re-sync the toggle — out of scope here.
- **`params` sit inside a collapsed `<details>` "詳細設定（レイアウト調整）"**. Keeps the noisy layout-tuning fields (`学歴・職歴の最小行数` etc.) out of the default form view. Length-literal validation already lives in `codegen.ts`; the UI takes a free-text input and lets bad values surface as a Typst diagnostic in the preview banner.
- **Initial form data is `RESUME_EMPTY_DATA`.** Phase 4 will switch to LocalStorage-restored data when present.
- **`/phase0` was deleted** as the plan called for once `/resume` was wired (§7). The landing page now reads from `templateRegistry` and renders `enabled` templates as links plus disabled ones as "準備中" placeholders.

**Known caveats (carry into Phase 3+)**:

- Layout is intentionally minimal for Phase 2: a 2-column grid with a sticky preview column on `md+`, single-column stack on mobile. Phase 3 owns multi-page rendering, pinch-zoom, the resizable divider on desktop, and the form/preview tab switcher on mobile. The "Download PDF" button currently lives inside `<Preview>` and produces a fixed `resume.pdf` filename — Phase 3 should move it next to a `resume_{氏名}_{YYYYMMDD}.pdf` filename builder and the diagnostics banner.
- The `ResumeStore.compileInputs` `$derived` returns a fresh object on each invalidation, which is what allows `<Preview>`'s `$effect` to track changes via prop identity. If we ever switch to passing `sources`/`assets` as separate props, both sides need to keep using `$derived` to preserve dependency tracking.
- `Uint8Array` inside a `$state`-proxied object is not deeply proxied (Svelte treats typed arrays as leaves). Mutations to bytes themselves wouldn't trigger reactivity; we always swap the whole `data.写真` object, which does trigger. Phase 4's LocalStorage layer must base64-encode the bytes before serializing.
- Vitest's "Vite unexpectedly reloaded a test" warning still appears on the very first run after a clean `node_modules` (mentioned in Phase 1 results). Unchanged behavior — leave it for now; add to `optimizeDeps.include` only if it ever makes a test flake.

**Verification**: `pnpm run check` → 0 errors / 0 warnings. `pnpm run test` → 6 files, 60 tests passed (52 existing from Phase 1 + 8 new for the state helpers). Playwright probe against the running dev server: `/resume` mounts, the worker boots, the preview SVG appears with `RESUME_EMPTY_DATA`, editing a name field triggers a recompile within the debounce window, the 詳細設定 `<details>` opens with the length-literal inputs visible, and adding a 学歴 row updates the list. 0 console errors and 0 page errors throughout.

### Phase 3 — Preview & export — DONE

- [x] Preview component handles multi-page output (typst.ts renders all pages into a single SVG; sibling `<svg>` elements get a top margin via scoped global selector).
- [x] Desktop: two-column layout (form left, preview right). Resizable divider not implemented — `md:grid-cols-2` with `h-[100dvh]` and `min-h-0 overflow-y-auto` on the form column proved good enough.
- [x] Mobile: tab switcher (Form / Preview). Both panels stay mounted; only visibility toggles, so the Typst worker and the last-rendered SVG persist across tab changes.
- [x] "Download PDF" button → worker export → blob → filename `resume_{氏名}_{YYYYMMDD}.pdf`.
- [x] Typst compile warnings/errors surface in a non-blocking banner; preview keeps the last good SVG visible on failure.
- ~~Pinch-zoom / explicit zoom controls~~ — reverted. See Phase 3 results.

#### Phase 3 results

**Files added / changed**:

```
src/lib/typst/
  ├── Preview.svelte          # diagnostics now color-coded by severity, path/range shown
  └── worker-client.ts        # new TypstCompileError carries diagnostics across failed jobs
src/lib/templates/resume/
  ├── filename.ts             # buildResumeFilename(data, now)
  └── filename.spec.ts        # 6 tests
src/routes/resume/
  └── +page.svelte            # mobile tab switcher + h-[100dvh] flex layout
```

**Design decisions locked in**:

- **Tabs keep both panels mounted.** Mobile tab switching toggles Tailwind visibility (`{tab === 'form' ? 'flex' : 'hidden'} md:flex`) rather than conditional rendering. Unmounting the preview would terminate the Typst worker and re-run the ~1 s WASM init on every tab change; keeping it mounted also preserves the last-rendered SVG so the preview tab isn't blank while the next compile is in flight.
- **`TypstCompileError` carries diagnostics on failure.** `worker-client.ts` previously threw a plain `Error` when the worker responded `ok: false`, losing the diagnostics array. The new subclass preserves them so the preview can still render `error`/`warning` entries for compiles that produced no artifact (e.g. the user typed invalid Typst markup).
- **Filename sanitization is conservative.** `buildResumeFilename` strips `[\x00-\x1f/\\:*?"<>|]` (the intersection of unsafe chars across Windows/macOS/Linux and Safari's Content-Disposition handling). 氏名 empty → `resume_{YYYYMMDD}.pdf`. The date source is `data.日付` when explicit, today's local date when `auto`.
- **Diagnostic severity is rendered as color + icon.** Error entries red, warnings yellow, with the source path/range inline in gray. The list is capped at `max-h-32` with overflow so a broken template doesn't push the preview off-screen.
- **No zoom controls in v1.** An earlier iteration added `−/100%/+` buttons plus 2-finger pinch handlers using CSS `zoom:`. Effective zoom was clamped by the SVG's intrinsic rendering and didn't behave intuitively across breakpoints, so the feature was reverted. Deferred to a future phase — the likely path is a pdf.js-backed preview or scaling the SVG viewBox directly rather than CSS zoom.

**Known caveats (carry into Phase 4+)**:

- In Svelte 5 dev mode, `BasicInfoForm.svelte:37` still logs `ownership_invalid_mutation` because the `$effect` there writes `data.日付` via an unbound prop. Pre-existing from Phase 2 — a real fix requires wiring `bind:data` through ResumeForm. Non-blocking; dev-only warning.
- `h-[100dvh]` is ideal for mobile (accounts for the browser chrome collapsing) but some older browsers fall back to `100vh`. Acceptable — worst case is a slight layout overflow that `overflow-y-auto` hides.
- `<Preview>` filename uses prop identity at click time. The parent feeds a `$derived(buildResumeFilename(store.data))` so the download name always reflects the latest 氏名/日付, but if future code passes a stale string it will download with that name. Keep the `$derived` wrapper.

**Verification**: `pnpm run check` → 0/0, `pnpm run test` → 9 files / 79 tests passed. Playwright probe on the running dev server: zoom/share/reset/download buttons present; mobile tab switcher toggles at 400px; the preview SVG persists across tab switches.

### Phase 4 — Persistence & sharing — DONE

- [x] LocalStorage auto-save (debounced 500 ms; key `pdf-by-typst.resume.v1`).
- [x] Schema-versioned save format (`{ version: 1, data: … }`) so future field additions don't break old saves.
- [x] Share button: `sanitizeForShare` (or photo passthrough when opted-in) → JSON → `lz-string` `compressToEncodedURIComponent` → `location.hash = '#t=resume&data=…'`, copy to clipboard.
- [x] UI message when sharing: "写真は未設定のため、共有リンクには含まれません。" when no photo, or a "写真を含める" checkbox when one exists.
- [x] On load, detect `#t=…&data=…`:
  - Parse + validate against the template's hand-written schema.
  - Import-confirmation modal with per-field summary (氏名 / 住所プレビュー / 件数 / 文字数 / 写真 有無).
  - On accept: `store.replaceData(next)` + `saveResumeToStorage(next)` + `history.replaceState` to strip fragment. On cancel: strip fragment only.
- [x] Encoded-payload size warning: the share dialog shows the fragment length and flags it past 8 000 chars.

#### Phase 4 results

**Files added / changed**:

```
src/lib/
  ├── base64.ts                     # chunked Uint8Array ⇄ base64
  └── share/
      ├── url.ts                    # encodeShareFragment / parseShareFragment / buildShareUrl
      └── url.spec.ts               # 6 tests
src/lib/templates/resume/
  ├── persistence.ts                # RESUME_STORAGE_KEY, envelope, toWire/fromWire, validate*, serializeForShare, load/save/clear helpers
  ├── persistence.spec.ts           # 7 tests (roundtrip, photo, share-strip, version guard, field validation)
  ├── state.svelte.ts               # ResumeStore accepts initial data; new `version` counter + replaceData() + reset()
  └── ui/
      ├── ShareDialog.svelte        # include-image toggle, URL preview, size warning, clipboard copy
      └── ImportDialog.svelte       # summary grid with 氏名 / 住所 / 件数 / 文字数 / 写真
src/routes/resume/
  └── +page.svelte                  # debounced autosave + hash detection + Share/Reset buttons
package.json                        # + lz-string 1.5.0
```

**Design decisions locked in**:

- **Single wire format for LocalStorage and share links.** `persistence.ts` exposes `serializeResumeJson` + `parseResumeJson` as the shared boundary. `serializeForShare(data, { includeImage })` wraps it — with `includeImage: false` the photo field is nulled before the wire conversion, so the exact same validator parses both storage and share payloads. No duplicate schemas.
- **Hand-written validator, not zod.** `validateWire` walks the parsed object and throws on missing/typed-wrong fields. Listed as a "zod/valibot" plan item, but adding the dependency for ~12 structural checks felt disproportionate. The validator is template-specific and its scope matches `ResumeData` exactly. When we add the invoice template, we'll re-evaluate (both templates together might justify a shared schema library).
- **Schema version lives in the envelope, not in the key.** The key stays `pdf-by-typst.resume.v1` (matches the CONSEPT_AND_PLAN §1 spec) and the envelope carries `{ version: 1, data: … }`. Future breaking changes add a `v2` handler in `parseResumeJson` and keep the old envelope parseable. The key doesn't bump unless the entire top-level shape changes.
- **`ResumeStore.version` is the remount signal.** Imports / reset call `store.replaceData(next)` which swaps `data` and increments `version`. The page wraps the form in `{#key store.version}` so `BasicInfoForm`'s `untrack`-initialized local state (the 作成日付 radio mode) re-seeds from the imported values. The preview is _outside_ the key so it survives remounts — the Typst worker stays alive.
- **Initial load is synchronous, hash detection is on-mount.** `loadResumeFromStorage()` runs in the page's setup script, before the child components instantiate, so on first render the form already has the restored data. `parseShareFragment` runs in `onMount` because a hash-based import flows through the confirmation modal, not the initial render. Race aside: if autosave fires before the user accepts the import, `hasResumeInStorage()` snapshot in the dialog is computed at render time (before the 500 ms debounce fires), so the "上書きされます" warning reflects true pre-import state.
- **Photo bytes base64 at the JSON boundary.** `Uint8Array` inside `ResumeData` is the runtime shape; `toWire` base64-encodes to `bytesBase64` for both storage and share. Chunked `String.fromCharCode(...slice)` in `base64.ts` avoids the argument-count limit that breaks on large spreads. Survives `structuredClone` → JSON → parse → decode roundtrip (tested).
- **Share dialog hides the image toggle when no photo exists.** Avoids dangling UI. When a photo is present, the toggle is unchecked by default (CONSEPT_AND_PLAN §1 "image fields excluded by default") and flipping it to include the photo shows the size warning more prominently because base64-encoded JPEG bytes dominate the URL length. Length threshold is 8 000 chars — chosen as the point where chat clients start truncating and QR codes become impractical.
- **Reset uses `window.confirm`.** Destructive action (drops LocalStorage + replaces store with empty defaults), so native confirm is enough — no need for a second custom modal. If we ever add multi-template state to the reset scope, we'll swap to a proper dialog.
- **Autosave failures are swallowed.** Quota exceeded / disabled storage / private mode — the app keeps working, PDF export still produces a file, only persistence is gone. A future phase may surface a one-time warning if writes fail on mount.

**Known caveats (carry into Phase 5+)**:

- Reset uses native `confirm()`, which blocks the event loop and looks out of place on mobile. Acceptable for v1; can move to a proper dialog if it bothers users.
- LocalStorage quota is ~5 MB per origin. A 600 px JPEG at q=0.85 is ~50–150 KB base64, which is fine. Very large resumes with many markdown lines could theoretically blow the quota — the swallowed-failure path covers that case but doesn't inform the user.
- `persistence.ts` runs in the server Vitest project (its spec doesn't need a browser). `localStorage` is referenced but only inside `typeof localStorage === 'undefined'` guards, so the module imports cleanly in Node.
- The import modal's `hasExisting` prop is evaluated once when the modal first renders. If the autosave debounce fires _before_ the modal opens but _after_ the page mounts, the warning state could lag by one keystroke — in practice the 500 ms debounce plus the synchronous `onMount` detection means the modal opens first. Monitor once the invoice template adds its own import path.
- Share URL compression currently runs twice in `ShareDialog` — once for the length counter, once for `buildShareUrl`. Cheap on resume-sized payloads but worth memoizing in one place when we add more templates that share the dialog.

**Verification**: `pnpm run check` → 0/0. `pnpm run test` → 9 files / 79 tests passed (6 filename + 7 persistence + 6 share/url added since Phase 2). Playwright smoke: share modal opens/closes, reset button confirm flow works, mobile tabs appear at 400 px wide, preview SVG persists across tab switches.

### Phase 5 — Offline & deployment

- [ ] Switch SvelteKit adapter to `@sveltejs/adapter-static`.
- [ ] Service Worker (via `@sveltejs/service-worker`) caching: WASM binaries, font files, JS/CSS, template `lib.typ`.
- [ ] Cloudflare Pages project. (`_headers` for COOP/COEP not needed — see Phase 0 results.)
- [ ] Lighthouse / real-device perf pass.
- [ ] README: document the first-load cost so users aren't surprised.

### Phase 6+ — Invoice template (post-v1)

Only start once Phases 0–5 are shipped and stable.

- [ ] Copy `typst-invoice-template` into `src/lib/templates/invoice/template/`.
- [ ] `InvoiceData` type + `buildMainTyp` codegen.
- [ ] Form UI (items list is the variable-length component; totals stay Typst-side).
- [ ] Route `/invoice` activated; landing page exposes the template picker.
- [ ] At this point, revisit the `TemplateModule` interface and refactor anything that turned out to be resume-specific. Keep the abstraction honest — if only two pieces match, don't force a third.

---

## 6. Risks & Open Items

- **String-interpolation safety.** We're generating Typst source from user input. `escapeTypst` must be paranoid; every input site needs a matching test.
- **Over-abstraction.** With only resume on screen in v1, the `TemplateModule` interface risks being shaped too closely to the resume. Re-evaluate when the invoice lands (Phase 6) and refactor rather than accumulating workarounds.
- **Photo size in shared URLs.** Handled by default-exclude + toggle (§1), but the warning UI copy needs care.
- **iOS Safari file download.** Saving a `Blob` PDF works but filename behavior is quirky; Phase 3 needs a real-device check.
- **Template drift.** Since we copy (not submodule) `lib.typ`/`main.typ` into this repo, upstream template changes require a manual sync PR that also updates `types.ts` + `codegen.ts`. Document this workflow in the README once Phase 1 lands.

## 7. Immediate Next Step

Phases 0–4 are done (see §5). Start **Phase 5** — swap the SvelteKit adapter to `@sveltejs/adapter-static`, wire `@sveltejs/service-worker` to precache the WASM binaries + font + generated JS/CSS + template sources, provision a Cloudflare Pages project (no `_headers` needed; Phase 0 ruled out COOP/COEP), and run a Lighthouse + real-device pass. Document the first-load cost in the README before shipping. Zoom controls and any pdf.js fallback are out-of-phase follow-ups to revisit after deployment.
