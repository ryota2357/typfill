<script lang="ts" generics="T">
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import { onMount, type Snippet } from "svelte";
  import { parseShareFragment } from "$lib/templates/url";
  import Preview from "$lib/typst/Preview.svelte";
  import type { CompileInputs } from "$lib/typst/protocol";
  import Button from "./Button.svelte";
  import ShareDialog from "./ShareDialog.svelte";
  import StatusDot from "./StatusDot.svelte";

  type TemplateRef = {
    templateId: string;
    label: string;
    storageKey: string;
    serialize: (data: T, options?: { for?: "share" | "storage" }) => string;
    buildCompileInputs: (data: T) => CompileInputs;
  };

  interface Props {
    data: T;
    template: TemplateRef;
    filename: string;
    children: Snippet;
    shareExtraNotice?: Snippet;
    onreset?: () => void;
    onimport?: (payload: string) => void;
    importError?: string;
  }
  let {
    data,
    template,
    filename,
    children,
    shareExtraNotice,
    onreset,
    onimport,
    importError,
  }: Props = $props();

  let tab = $state<"form" | "preview">("form");
  let shareOpen = $state(false);
  let saveState = $state<"saving" | "saved" | "error">("saved");

  const compileInputs = $derived(template.buildCompileInputs(data));

  // saveState → StatusDot props. A lookup keeps the tone/label pairing in one
  // place instead of two parallel nested ternaries in the markup.
  const SAVE_INDICATOR = {
    saving: { tone: "busy", label: "saving…" },
    saved: { tone: "neutral", label: "autosaved" },
    error: { tone: "error", label: "save failed" },
  } as const;
  const saveIndicator = $derived(SAVE_INDICATOR[saveState]);

  // The initial mount fires this effect once and writes the serialized payload
  // back — idempotent, and doubles as the "saved" signal for the indicator.
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const payload = template.serialize(data);
    saveState = "saving";
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(template.storageKey, payload);
        saveState = "saved";
      } catch {
        // Surface quota / disabled storage as a status pill — silent failure
        // was the prior bug.
        saveState = "error";
      }
    }, 500);
  });

  // Scrub the hash after handing off the payload so a reload doesn't
  // re-trigger the import modal.
  onMount(() => {
    const frag = parseShareFragment(location.hash);
    if (!frag) return;
    if (frag.templateId !== template.templateId) return;
    onimport?.(frag.payload);
    history.replaceState(null, "", location.pathname + location.search);
  });

  function resetAll() {
    if (!confirm("フォームの内容を破棄して空の状態に戻しますか？")) return;
    onreset?.();
  }
</script>

<svelte:head><title>{template.label} - Typfill</title></svelte:head>

{#snippet tabButton(id: "form" | "preview", label: string)}
  <button
    type="button"
    role="tab"
    aria-selected={tab === id}
    onclick={() => (tab = id)}
    class={[
      "flex-1 cursor-pointer rounded px-2.5 py-1.5 transition",
      tab === id ? "bg-white font-semibold shadow-sm" : "text-neutral-500",
    ]}
  >
    {label}
  </button>
{/snippet}

<main class="flex h-[100dvh] flex-col text-[13px] leading-[1.55]">
  <header
    class="flex flex-shrink-0 items-center justify-between gap-3 border-b border-neutral-200 px-5 py-2.5"
  >
    <div class="flex min-w-0 items-baseline gap-3">
      <a
        href="/"
        aria-label="トップへ戻る"
        class="text-neutral-500 hover:text-neutral-900"
      >
        <ArrowLeft size={14} />
      </a>
      <span class="hidden font-mono text-[11px] text-neutral-400 md:inline">
        Typfill /
      </span>
      <h1 class="text-[15px] font-semibold">{template.label}</h1>
      <span class="font-mono text-[11px] text-neutral-400">
        {template.templateId}
      </span>
    </div>
    <div class="flex items-center gap-2">
      <div class="hidden items-center gap-2 md:flex">
        <StatusDot {...saveIndicator} />
        <div class="h-4 w-px bg-neutral-200"></div>
      </div>
      <Button onclick={() => (shareOpen = true)}>共有</Button>
      <Button variant="subtle" onclick={resetAll}>リセット</Button>
    </div>
  </header>

  {#if importError}
    <p
      class="flex-shrink-0 border-b border-red-200 bg-red-50 px-5 py-2 text-[12px] text-red-800"
    >
      共有リンクの読み込みに失敗: {importError}
    </p>
  {/if}

  <div
    class="flex-shrink-0 border-b border-neutral-200 bg-white px-3 py-2 md:hidden"
    role="tablist"
    aria-label="画面切り替え"
  >
    <div
      class="flex gap-0.5 rounded-md border border-neutral-200 bg-neutral-100 p-0.5"
    >
      {@render tabButton("form", "フォーム")}
      {@render tabButton("preview", "プレビュー")}
    </div>
  </div>

  <div
    class="grid min-h-0 flex-1 md:grid-cols-[minmax(360px,1fr)_minmax(420px,1.1fr)]"
  >
    <section
      class={[
        tab === "form" ? "flex" : "hidden",
        "min-h-0 flex-col overflow-y-auto px-5 pt-5 pb-16 md:flex md:border-r md:border-neutral-200",
      ]}
    >
      {@render children()}
    </section>
    <section
      class={[
        tab === "preview" ? "flex" : "hidden",
        "min-h-0 flex-col md:flex",
      ]}
    >
      <Preview inputs={compileInputs} downloadName={filename} />
    </section>
  </div>
</main>

{#if shareOpen}
  <ShareDialog
    {data}
    template={{ templateId: template.templateId, serialize: template.serialize }}
    onclose={() => (shareOpen = false)}
    extraNotice={shareExtraNotice}
  />
{/if}
