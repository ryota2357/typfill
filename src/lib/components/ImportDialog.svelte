<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    dataLabel,
    hasExisting,
    onaccept,
    oncancel,
    preview,
  }: {
    dataLabel: string;
    hasExisting: boolean;
    onaccept: () => void;
    oncancel: () => void;
    preview: Snippet;
  } = $props();

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") oncancel();
  }
</script>

<svelte:window onkeydown={onKey} />

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
  role="dialog"
  aria-modal="true"
  aria-labelledby="import-title"
>
  <div class="w-full max-w-md space-y-4 rounded-lg bg-white p-5 shadow-xl">
    <h2 id="import-title" class="text-lg font-bold">共有リンクから読み込み</h2>

    <p class="text-sm text-gray-700">
      この URL には{dataLabel}が含まれています。読み込みますか？
    </p>

    {#if hasExisting}
      <p
        class="rounded border border-orange-200 bg-orange-50 p-2 text-sm text-orange-900"
      >
        ⚠ 現在ブラウザに保存されているデータは上書きされます。
      </p>
    {/if}

    <dl
      class="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 rounded border border-gray-200 bg-gray-50 p-3 text-xs text-gray-800"
    >
      {@render preview()}
    </dl>

    <div class="flex items-center justify-end gap-2">
      <button
        type="button"
        onclick={oncancel}
        class="rounded border border-gray-300 px-4 py-1.5 text-sm hover:bg-gray-100"
      >
        キャンセル
      </button>
      <button
        type="button"
        onclick={onaccept}
        class="rounded bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        読み込む
      </button>
    </div>
  </div>
</div>
