<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import type { CompileInputs, TypstDiagnostic } from "./protocol";
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
    try {
      const snapshot = inputs;
      const res = await c.compile(snapshot, { signal: ctl.signal });
      svg = res.svg;
      diagnostics = res.diagnostics;
      error = "";
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

<div class="flex h-full flex-col gap-2">
  <div class="flex flex-wrap items-center justify-between gap-2 text-sm">
    <span class="text-gray-500">プレビュー: {status}</span>
    <button
      type="button"
      onclick={downloadPdf}
      disabled={!client || status === "booting" || exporting}
      class="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700 disabled:opacity-50"
    >
      {exporting ? "PDF 生成中…" : "PDF をダウンロード"}
    </button>
  </div>

  {#if error}
    <pre
      class="rounded bg-red-50 p-2 text-xs whitespace-pre-wrap text-red-800"
    >{error}</pre>
  {/if}

  {#if diagnostics.length > 0}
    <ul
      class="max-h-32 space-y-0.5 overflow-y-auto rounded border border-gray-200 bg-white p-2 text-xs"
    >
      {#each diagnostics as d, i (i)}
        <li class={d.severity === "error" ? "text-red-800" : "text-yellow-900"}>
          <strong
            class={d.severity === "error" ? "text-red-900" : "text-yellow-900"}
          >
            {d.severity}
          </strong>
          {#if d.path}
            <span class="text-gray-500"
              >[{d.path}{d.range ? `:${d.range}` : ""}]</span
            >
          {/if}
          : {d.message}
        </li>
      {/each}
    </ul>
  {/if}

  <div
    class="preview min-h-[600px] flex-1 overflow-auto rounded border border-gray-200 bg-gray-50"
  >
    {#if status === "booting"}
      <p class="p-4 text-gray-500">ワーカーを起動中…</p>
    {:else if svg}
      <!-- TODO: sanitize. rawMarkupLit fields let users author arbitrary
           Typst, so the output can contain attacker-controlled content
           (javascript: link targets, foreignObject HTML). -->
      {@html svg}
    {:else if status === "compiling"}
      <p class="p-4 text-gray-500">コンパイル中…</p>
    {/if}
  </div>
</div>

<style>
  .preview :global(svg) {
    display: block;
    max-width: 100%;
    height: auto;
    margin: 0 auto;
    background: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  .preview :global(svg + svg) {
    margin-top: 0.75rem;
  }
</style>
