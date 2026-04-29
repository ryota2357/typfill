<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import Button from "$lib/components/Button.svelte";
  import type { CompileInputs, TypstDiagnostic } from "./protocol";
  import SandboxedSvg from "./SandboxedSvg.svelte";
  import { type TypstClient, TypstCompileError } from "./worker-client";

  let {
    inputs,
    debounceMs = 400,
    downloadName = "document.pdf",
  }: {
    inputs: CompileInputs;
    debounceMs?: number;
    downloadName?: string;
  } = $props();

  let client = $state<TypstClient | null>(null);
  let svg = $state("");
  let status = $state<"booting" | "compiling" | "ready" | "failed">("booting");
  let error = $state("");
  let diagnostics = $state<TypstDiagnostic[]>([]);
  let exporting = $state(false);
  let lastCompileMs = $state(0);

  // typst.ts emits one `<svg>` root per page, so a regex-count of opening
  // tags is enough for the footer indicator. SandboxedSvg parses the same
  // structure for height computation; that helper isn't exported so the
  // count is duplicated here rather than threading state across components.
  const pageCount = $derived((svg.match(/<svg\b/g) ?? []).length);

  // NOTE: Zoom controls (the design's −/100%/+ cluster) are intentionally
  // omitted. POC attempts conflicted with SandboxedSvg's ResizeObserver-
  // driven height computation — the rescaled iframe content reported a
  // stale height and the preview pane truncated. Revisit when the SVG
  // sizing pipeline can carry an explicit scale factor end-to-end.

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let activeAbort: AbortController | null = null;

  onMount(async () => {
    const { createTypstClient } = await import("./worker-client");
    client = createTypstClient();
  });

  onDestroy(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
    activeAbort?.abort();
    client?.dispose();
  });

  $effect(() => {
    void inputs;
    if (!client) return;
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(runCompile, debounceMs);
  });

  async function runCompile() {
    const c = client;
    if (!c) return;
    activeAbort?.abort();
    const ctl = new AbortController();
    activeAbort = ctl;
    status = "compiling";
    const startedAt = performance.now();
    try {
      const snapshot = inputs;
      const res = await c.compile(snapshot, { signal: ctl.signal });
      svg = res.svg;
      diagnostics = res.diagnostics;
      error = "";
      lastCompileMs = Math.round(performance.now() - startedAt);
      status = "ready";
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return;
      // Preserve diagnostics from failed compiles so the user sees which
      // line the error came from. Keep the stale SVG visible.
      diagnostics = e instanceof TypstCompileError ? e.diagnostics : [];
      error = e instanceof Error ? e.message : String(e);
      status = "failed";
    }
  }

  async function downloadPdf() {
    const c = client;
    if (!c) return;
    exporting = true;
    error = "";
    try {
      const res = await c.exportPdf(inputs);
      const blob = new Blob([res.pdf as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      exporting = false;
    }
  }
</script>

<div class="flex h-full min-h-0 flex-col bg-neutral-50">
  <div
    class="flex flex-shrink-0 items-center justify-between gap-2 border-b border-neutral-200 bg-white px-4 py-2.5"
  >
    <div class="flex items-center gap-2 font-mono text-[11px] text-neutral-500">
      <span
        class="h-1.5 w-1.5 rounded-full {status === 'ready'
          ? 'bg-emerald-500'
          : status === 'failed'
            ? 'bg-red-500'
            : 'bg-neutral-400'}"
      ></span>
      {#if status === "booting"}
        ワーカー起動中…
      {:else if status === "compiling"}
        compiling…
      {:else if status === "ready"}
        compiled · {lastCompileMs} ms
      {:else}
        compile failed
      {/if}
    </div>
    <Button
      variant="primary"
      onclick={downloadPdf}
      disabled={!client || status === "booting" || exporting}
    >
      {exporting ? "PDF 生成中…" : "PDF をダウンロード"}
    </Button>
  </div>

  {#if error}
    <pre
      class="flex-shrink-0 border-b border-red-200 bg-red-50 px-4 py-2 text-[11px] whitespace-pre-wrap text-red-800"
    >{error}</pre>
  {/if}

  {#if diagnostics.length > 0}
    <ul
      class="flex-shrink-0 max-h-32 space-y-0.5 overflow-y-auto border-b border-neutral-200 bg-white px-4 py-2 text-[11px]"
    >
      {#each diagnostics as d, i (i)}
        <li class={d.severity === "error" ? "text-red-800" : "text-yellow-900"}>
          <strong
            class={d.severity === "error" ? "text-red-900" : "text-yellow-900"}
          >
            {d.severity}
          </strong>
          {#if d.path}
            <span class="text-neutral-500"
              >[{d.path}{d.range ? `:${d.range}` : ""}]</span
            >
          {/if}
          : {d.message}
        </li>
      {/each}
    </ul>
  {/if}

  <div class="flex min-h-0 flex-1 justify-center overflow-auto p-6">
    {#if svg}
      <SandboxedSvg {svg} />
    {:else if status === "booting"}
      <p class="self-center text-neutral-500">ワーカーを起動中…</p>
    {:else if status === "compiling"}
      <p class="self-center text-neutral-500">コンパイル中…</p>
    {/if}
  </div>

  <div
    class="flex flex-shrink-0 items-center justify-between gap-2 border-t border-neutral-200 bg-white px-4 py-2 font-mono text-[11px] text-neutral-400"
  >
    <span class="overflow-hidden text-ellipsis whitespace-nowrap">
      {downloadName}
    </span>
    <span class="flex-shrink-0">A4 · {pageCount || 1}p</span>
  </div>
</div>
