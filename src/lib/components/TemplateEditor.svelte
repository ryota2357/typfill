<script lang="ts" generics="T">
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import { onMount, type Snippet } from "svelte";
  import { parseShareFragment } from "$lib/templates/url";
  import Preview from "$lib/typst/Preview.svelte";
  import type { CompileInputs } from "$lib/typst/protocol";
  import Button from "./Button.svelte";
  import ShareDialog from "./ShareDialog.svelte";

  // The editor consumes the same 3 entry points every template exposes. Kept
  // local to avoid re-importing SerializeOptions from the codec module for
  // what is essentially a structural shape.
  type TemplateRef = {
    templateId: string;
    label: string;
    storageKey: string;
    serialize: (data: T, options?: { for?: "share" | "storage" }) => string;
    buildCompileInputs: (data: T) => CompileInputs;
  };

  let {
    data,
    template,
    filename,
    children,
    shareExtraNotice,
    onreset,
    onimport,
    importError,
  }: {
    data: T;
    template: TemplateRef;
    filename: string;
    children: Snippet;
    shareExtraNotice?: Snippet;
    onreset?: () => void;
    onimport?: (payload: string) => void;
    importError?: string;
  } = $props();

  let tab = $state<"form" | "preview">("form");
  let shareOpen = $state(false);
  let saveState = $state<"saving" | "saved" | "error">("saved");

  const compileInputs = $derived(template.buildCompileInputs(data));

  // Autosave. `template.serialize(data)` walks every field, so this effect
  // re-runs on any nested mutation. The write itself is debounced to 500 ms
  // to avoid thrashing storage on rapid typing. The first mount also fires
  // this effect once — that initial write is harmless (idempotent) and
  // doubles as a "saved" signal for the indicator.
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
        // Quota exceeded or storage disabled. Surface as a status pill —
        // we don't want to throw, but silent failure was the prior bug.
        saveState = "error";
      }
    }, 500);
  });

  // URL fragment detection. The parent handles deserialize and the import
  // dialog; we just forward the raw payload and scrub the hash so a reload
  // doesn't re-trigger the modal.
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
        <span
          class="flex items-center gap-1.5 font-mono text-[11px] text-neutral-500"
        >
          <span
            class={[
              "h-1.5 w-1.5 rounded-full",
              saveState === "error" ? "bg-red-500" : "bg-neutral-400",
            ]}
          ></span>
          {saveState === "saving"
            ? "saving…"
            : saveState === "error"
              ? "save failed"
              : "autosaved"}
        </span>
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

  <!-- Mobile tab switch (pill). Hidden on md+ where both panes are visible. -->
  <div
    class="flex-shrink-0 border-b border-neutral-200 bg-white px-3 py-2 md:hidden"
    role="tablist"
    aria-label="画面切り替え"
  >
    <div
      class="flex gap-0.5 rounded-md border border-neutral-200 bg-neutral-100 p-0.5"
    >
      <button
        type="button"
        role="tab"
        aria-selected={tab === "form"}
        onclick={() => (tab = "form")}
        class={[
          "flex-1 cursor-pointer rounded px-2.5 py-1.5 transition",
          tab === "form"
            ? "bg-white font-semibold shadow-sm"
            : "text-neutral-500",
        ]}
      >
        フォーム
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === "preview"}
        onclick={() => (tab = "preview")}
        class={[
          "flex-1 cursor-pointer rounded px-2.5 py-1.5 transition",
          tab === "preview"
            ? "bg-white font-semibold shadow-sm"
            : "text-neutral-500",
        ]}
      >
        プレビュー
      </button>
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
