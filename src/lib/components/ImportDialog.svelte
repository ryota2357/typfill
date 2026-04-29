<script lang="ts">
  import type { Snippet } from "svelte";
  import Button from "./Button.svelte";

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
  <div
    class="flex w-full max-w-md flex-col gap-4 rounded-md border border-neutral-200 bg-white p-5 shadow-xl"
  >
    <h2 id="import-title" class="text-[16px] font-bold">
      共有リンクから読み込み
    </h2>

    <p class="text-[13px] text-neutral-700">
      この URL には{dataLabel}が含まれています。読み込みますか？
    </p>

    {#if hasExisting}
      <p
        class="rounded-sm border border-orange-200 bg-orange-50 p-2 text-[12px] text-orange-900"
      >
        ⚠ 現在ブラウザに保存されているデータは上書きされます。
      </p>
    {/if}

    <dl
      class="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 rounded-sm border border-neutral-200 bg-neutral-50 p-3 text-[12px] text-neutral-800"
    >
      {@render preview()}
    </dl>

    <div class="flex items-center justify-end gap-2">
      <Button size="md" onclick={oncancel}>キャンセル</Button>
      <Button variant="primary" size="md" onclick={onaccept}>読み込む</Button>
    </div>
  </div>
</div>
