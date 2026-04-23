<script lang="ts" generics="T">
  import { onMount, type Snippet } from "svelte";
  import { parseShareFragment } from "$lib/templates/url";
  import Preview from "$lib/typst/Preview.svelte";
  import type { CompileInputs } from "$lib/typst/protocol";
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

  const compileInputs = $derived(template.buildCompileInputs(data));

  // Autosave. `template.serialize(data)` walks every field, so this effect
  // re-runs on any nested mutation. The write itself is debounced to 500 ms
  // to avoid thrashing storage on rapid typing.
  let saveTimer: ReturnType<typeof setTimeout> | null = null;
  $effect(() => {
    const payload = template.serialize(data);
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(template.storageKey, payload);
      } catch {
        // Quota exceeded or storage disabled — intentionally swallowed.
        // Autosave failures must not break the form.
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

<main class="mx-auto flex h-[100dvh] max-w-7xl flex-col gap-3 p-3 md:p-4">
  <header class="flex flex-wrap items-baseline justify-between gap-2">
    <div class="flex items-baseline gap-3">
      <h1 class="text-xl font-bold">{template.label}</h1>
      <a href="/" class="text-sm text-blue-600 hover:underline">← トップ</a>
    </div>
    <div class="flex items-center gap-2 text-sm">
      <button
        type="button"
        onclick={() => (shareOpen = true)}
        class="rounded border border-gray-300 px-3 py-1 hover:bg-gray-100"
      >
        共有リンク
      </button>
      <button
        type="button"
        onclick={resetAll}
        class="rounded border border-gray-300 px-3 py-1 text-gray-600 hover:bg-gray-100"
      >
        リセット
      </button>
    </div>
  </header>

  {#if importError}
    <p class="rounded bg-red-50 p-2 text-xs text-red-800">
      共有リンクの読み込みに失敗: {importError}
    </p>
  {/if}

  <div
    class="flex gap-1 rounded border border-gray-300 bg-gray-100 p-1 text-sm md:hidden"
    role="tablist"
    aria-label="画面切り替え"
  >
    <button
      type="button"
      role="tab"
      aria-selected={tab === "form"}
      onclick={() => (tab = "form")}
      class="flex-1 rounded px-3 py-1.5 transition {tab === 'form'
        ? 'bg-white font-semibold shadow-sm'
        : 'text-gray-600 hover:bg-gray-200'}"
    >
      フォーム
    </button>
    <button
      type="button"
      role="tab"
      aria-selected={tab === "preview"}
      onclick={() => (tab = "preview")}
      class="flex-1 rounded px-3 py-1.5 transition {tab === 'preview'
        ? 'bg-white font-semibold shadow-sm'
        : 'text-gray-600 hover:bg-gray-200'}"
    >
      プレビュー
    </button>
  </div>

  <div class="grid min-h-0 flex-1 gap-4 md:grid-cols-2">
    <section
      class="{tab === 'form'
        ? 'flex'
        : 'hidden'} min-h-0 flex-col overflow-y-auto pr-1 md:flex"
    >
      {@render children()}
    </section>
    <section
      class="{tab === 'preview' ? 'flex' : 'hidden'} min-h-0 flex-col md:flex"
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
