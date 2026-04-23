<script lang="ts">
  import BaseImportDialog from "$lib/components/ImportDialog.svelte";
  import type { Contact, Fields } from "$lib/templates/resume";

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

  function truncate(s: string, max: number): string {
    return s.length > max ? `${s.slice(0, max)}…` : s;
  }

  // Compact住所 preview. Shows postal code (with 〒) plus the first 30 chars of
  // the address so the user can recognize which record this is without
  // exposing the full PII in a confirmation modal.
  function addressPreview(c: Contact): string {
    const postal = c.郵便番号.trim();
    const addr = c.住所.trim();
    if (!postal && !addr) return "（未設定）";
    const postalPart = postal ? `〒${postal}` : "";
    const addrPart = addr ? truncate(addr, 30) : "";
    return [postalPart, addrPart].filter(Boolean).join(" ");
  }

  const fullName = $derived(
    (imported.氏名.姓 + imported.氏名.名).trim() || "（未設定）",
  );
  const birth = $derived(
    `${imported.生年月日.year}-${String(imported.生年月日.month).padStart(2, "0")}-${String(
      imported.生年月日.day,
    ).padStart(2, "0")}`,
  );
</script>

<BaseImportDialog
  dataLabel="履歴書データ"
  {hasExisting}
  onaccept={() => onaccept(imported)}
  {oncancel}
  preview={previewContent}
/>

{#snippet previewContent()}
  <dt class="text-gray-500">氏名</dt>
  <dd class="break-all">{fullName}</dd>

  <dt class="text-gray-500">生年月日</dt>
  <dd class="tabular-nums">{birth}</dd>

  <dt class="text-gray-500">現住所</dt>
  <dd class="break-all">{addressPreview(imported.現住所)}</dd>

  <dt class="text-gray-500">連絡先</dt>
  <dd class="break-all">{addressPreview(imported.連絡先)}</dd>

  <dt class="text-gray-500">学歴</dt>
  <dd>{imported.学歴.length} 件</dd>

  <dt class="text-gray-500">職歴</dt>
  <dd>{imported.職歴.length} 件</dd>

  <dt class="text-gray-500">免許・資格</dt>
  <dd>{imported["免許・資格"].length} 件</dd>

  <dt class="text-gray-500">志望動機</dt>
  <dd>{imported.志望動機.length} 文字</dd>

  <dt class="text-gray-500">本人希望記入欄</dt>
  <dd>{imported.本人希望記入欄.length} 文字</dd>

  <dt class="text-gray-500">写真</dt>
  <dd>{imported.写真 ? "あり" : "なし"}</dd>
{/snippet}
