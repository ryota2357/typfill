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

| Field | Type | Notes |
|---|---|---|
| `日付` | `datetime` or `auto` | `auto` → `datetime.today()` |
| `氏名`, `氏名ふりがな` | `([last], [first])` tuple | |
| `生年月日` | `datetime(y, m, d)` | age auto-calculated |
| `性別` | markup | e.g. `[男]` |
| `写真` | image or `none` | |
| `現住所`, `連絡先` | record `(郵便番号, 住所, 住所ふりがな, 電話, E-mail)` | |
| `学歴`, `職歴`, `免許・資格` | **variable-length array** of `(year, month, content)` tuples | |
| `志望動機`, `本人希望記入欄` | markup (multi-line) | |
| `params` | layout tuning record | e.g. `学歴・職歴の最小行数: 22`, `志望動機の高さ: 22em` |

Helpers / quirks:

- `元号()` converts Gregorian year → Japanese era.
- `layout()`-based auto-shrink for long e-mail strings.
- Empty `職歴` renders as "なし".
- `写真` uses Typst's `image()` — in the browser we have to supply the file bytes to the Typst VFS rather than a path.

### 2.2 Invoice (`~/ghq/github.com/ryota2357/typst-invoice-template`)

**Same architectural pattern as the resume.** Two-file layout (`lib.typ` + `main.typ`), `#show: invoice.with(...)`, no external Typst packages, same font (`Harano Aji Mincho`). Data-input contract — named function parameters:

| Field | Type | Notes |
|---|---|---|
| `title` | markup | default `[請求書]` |
| `date` | `datetime` or `auto` | |
| `invoice-number-series` | int | |
| `due-date` | `datetime` | |
| `recipient` | record `(name, postal-ccode, address)` | 宛先 |
| `issuer` | record `(name, postal-ccode, address)` | 発行元 |
| `account` | record `(bank, branch, type, number, holder)` | 振込先 |
| `items` | **variable-length array** of `(name, amount, unit?, price)` | 明細 |
| `min-item-rows` | int | default 8 |
| `tax-rate` | float | default `0.1` (10%) |
| `body` | markup | 備考 |

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
- **Source:** only the default SvelteKit welcome page and the Vitest sample. Nothing app-specific yet.
- **Adapter:** `@sveltejs/adapter-auto` (needs to be pinned to `@sveltejs/adapter-static` before deployment).
- **Not yet present:** `typst.ts`, `lz-string`, Web Worker scaffolding, PDF preview, LocalStorage glue, Service Worker, `_headers`, CI config.

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

### Phase 1 — Core engine + template abstraction

- [ ] `src/lib/typst/escape.ts` — `escapeTypst(value)` with exhaustive Vitest coverage of every special character.
- [ ] `src/lib/typst/worker.ts` / `worker-client.ts` — finalize message protocol, error surfacing, cancellation.
- [ ] `src/lib/templates/types.ts` — `TemplateModule<T>` interface (id, label, defaults, `buildMainTyp`, root form component, share sanitizer).
- [ ] `src/lib/templates/registry.ts` — registers the resume module; an empty invoice entry can be present but disabled.
- [ ] `src/lib/templates/resume/types.ts` — `ResumeData` TypeScript type mirroring §2.1.
- [ ] `src/lib/templates/resume/codegen.ts` — `buildMainTyp(data: ResumeData): string`. Round-trip tested by compiling and diffing against the upstream `main.typ` sample.

### Phase 2 — Resume form UI

- [ ] Svelte 5 runes store (`src/lib/templates/resume/state.svelte.ts`) holding `ResumeData` via `$state`, with `$derived` for preview input.
- [ ] Field components under `src/lib/templates/resume/ui/`: 基本情報, 現住所, 連絡先, 学歴, 職歴, 免許・資格, 志望動機, 本人希望記入欄.
- [ ] `学歴 / 職歴 / 免許・資格` are add/remove/reorder variable-length lists.
- [ ] Photo upload: `<input type="file">` → crop/compress → base64 in `ResumeData`.
- [ ] Tailwind mobile-first styling.
- [ ] Debounced reactive pipeline: store change → `buildMainTyp` → worker → SVG → preview component.

### Phase 3 — Preview & export

- [ ] Preview component implementing the decision from Phase 0. Must handle multi-page output and pinch-zoom on iOS/Android.
- [ ] Desktop: two-column layout (form left, preview right), resizable divider optional.
- [ ] Mobile: tab switcher (Form / Preview).
- [ ] "Download PDF" button → worker export → blob → filename `resume_{氏名}_{YYYYMMDD}.pdf`.
- [ ] Typst compile warnings/errors surface in a non-blocking banner.

### Phase 4 — Persistence & sharing

- [ ] LocalStorage auto-save (debounced; key `pdf-by-typst.resume.v1`).
- [ ] Schema-versioned save format so future field additions don't break old saves.
- [ ] Share button: strip image fields by default → JSON → `lz-string` → Base64 → `location.hash = '#t=resume&data=…'`, copy to clipboard.
- [ ] UI message when sharing: "写真は共有リンクに含まれません" (or similar), with explicit toggle to override.
- [ ] On load, detect `#t=…&data=…`:
  - Parse + validate against the template's schema.
  - Import-confirmation modal (overwrite vs discard if LocalStorage has data).
  - On accept: save, `history.replaceState` to strip fragment.
- [ ] Encoded-payload size warning if the share fragment gets unreasonably long (the image-exclusion default keeps the normal case small).

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

Phase 0 is done (see §5). Start **Phase 1** — formalize `escapeTypst()` with exhaustive tests, lift the ad-hoc worker protocol in `src/lib/typst/protocol.ts` to a stable shape (including cancellation), define `TemplateModule<T>` + the resume-specific `ResumeData` / `buildMainTyp` / `codegen.ts`. The `/phase0` route is intentionally disposable; delete it once `/resume` on real input is rendering in Phase 2.
