<script lang="ts">
  import BaseImportDialog from "$lib/components/ImportDialog.svelte";
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

  const dateLabel = $derived(
    imported.date === "auto"
      ? "自動（発行時）"
      : `${imported.date.year}-${String(imported.date.month).padStart(2, "0")}-${String(imported.date.day).padStart(2, "0")}`,
  );
  const dueLabel = $derived(
    `${imported["due-date"].year}-${String(imported["due-date"].month).padStart(2, "0")}-${String(imported["due-date"].day).padStart(2, "0")}`,
  );
</script>

<BaseImportDialog
  dataLabel="請求書データ"
  {hasExisting}
  onaccept={() => onaccept(imported)}
  {oncancel}
  preview={previewContent}
/>

{#snippet previewContent()}
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
{/snippet}
