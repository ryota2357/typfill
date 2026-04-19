<script lang="ts">
  import type { Fields } from "$lib/templates/invoice";

  let {
    imported,
    hasExisting,
    onaccept,
    oncancel,
  }: {
    imported: Fields;
    hasExisting: boolean;
    onaccept: (data: Fields) => void;
    oncancel: () => void;
  } = $props();

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") oncancel();
  }

  const dateLabel = $derived(
    imported.date === "auto"
      ? "自動（発行時）"
      : `${imported.date.year}-${String(imported.date.month).padStart(2, "0")}-${String(imported.date.day).padStart(2, "0")}`,
  );
  const dueLabel = $derived(
    `${imported["due-date"].year}-${String(imported["due-date"].month).padStart(2, "0")}-${String(imported["due-date"].day).padStart(2, "0")}`,
  );
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
      この URL には請求書データが含まれています。読み込みますか？
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
      <dt class="text-gray-500">タイトル</dt>
      <dd class="break-all">{imported.title || "（未設定）"}</dd>

      <dt class="text-gray-500">発行日</dt>
      <dd class="tabular-nums">{dateLabel}</dd>

      <dt class="text-gray-500">支払期限</dt>
      <dd class="tabular-nums">{dueLabel}</dd>

      <dt class="text-gray-500">請求先</dt>
      <dd class="break-all">{imported.recipient.name || "（未設定）"}</dd>

      <dt class="text-gray-500">請求元</dt>
      <dd class="break-all">{imported.issuer.name || "（未設定）"}</dd>

      <dt class="text-gray-500">項目</dt>
      <dd>{imported.items.length} 件</dd>
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
        onclick={() => onaccept(imported)}
        class="rounded bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        読み込む
      </button>
    </div>
  </div>
</div>
