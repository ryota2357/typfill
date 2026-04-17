<script lang="ts">
  import type { Contact, ResumeData } from "../types";

  let {
    imported,
    hasExisting,
    onaccept,
    oncancel,
  }: {
    imported: ResumeData;
    hasExisting: boolean;
    onaccept: (data: ResumeData) => void;
    oncancel: () => void;
  } = $props();

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") oncancel();
  }

  function truncate(s: string, max: number): string {
    return s.length > max ? s.slice(0, max) + "…" : s;
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
      この URL には履歴書データが含まれています。読み込みますか？
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
