<script module lang="ts">
  // Visual hint for a single preview cell. Picks a CSS treatment without
  // letting the caller leak free-form classes into the modal:
  //   - "tabular"  → tabular-nums (dates, amounts — column digits align)
  //   - "break-all" → break-all (PII strings that may not have spaces)
  //   - "default"  → plain text (counts like "5 件", short labels)
  export type PreviewFormat = "tabular" | "break-all" | "default";

  export type PreviewItem = {
    label: string;
    value: string;
    format?: PreviewFormat;
  };
</script>

<script lang="ts">
  import Button from "./Button.svelte";
  import Dialog from "./Dialog.svelte";

  // Generic share-link import confirmation. Templates produce a flat
  // `previewItems` array keyed by their own domain labels; the dialog itself
  // never sees the underlying Fields type. The data-driven shape lets the
  // route page choose what to surface (e.g. the resume page redacts photo
  // bytes from the listing) without forking this component.
  let {
    dataLabel,
    hasExisting,
    previewItems,
    onaccept,
    oncancel,
  }: {
    dataLabel: string;
    hasExisting: boolean;
    previewItems: readonly PreviewItem[];
    onaccept: () => void;
    oncancel: () => void;
  } = $props();

  const VALUE_FORMAT: Record<PreviewFormat, string> = {
    tabular: "tabular-nums",
    "break-all": "break-all",
    default: "",
  };
</script>

<Dialog title="共有リンクから読み込み" onclose={oncancel} size="md">
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
    {#each previewItems as item (item.label)}
      <dt class="text-neutral-500">{item.label}</dt>
      <dd class={VALUE_FORMAT[item.format ?? "default"]}>{item.value}</dd>
    {/each}
  </dl>

  <div class="flex items-center justify-end gap-2">
    <Button size="md" onclick={oncancel}>キャンセル</Button>
    <Button variant="primary" size="md" onclick={onaccept}>読み込む</Button>
  </div>
</Dialog>
