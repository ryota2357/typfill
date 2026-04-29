<script module lang="ts">
  export type PhotoValue = { vfsPath: string; bytes: Uint8Array };
</script>

<script lang="ts">
  import Button from "../Button.svelte";

  let {
    value = $bindable(),
    vfsPath,
    maxSide,
    format,
    hint,
  }: {
    value: PhotoValue | null;
    vfsPath: string;
    maxSide: number;
    format: { type: "image/jpeg"; quality: number };
    hint?: string;
  } = $props();

  let previewUrl = $state<string | null>(null);
  let error = $state("");
  let fileInput: HTMLInputElement | undefined = $state();

  $effect(() => {
    if (!value) {
      previewUrl = null;
      return;
    }
    const blob = new Blob([value.bytes as BlobPart], { type: format.type });
    const url = URL.createObjectURL(blob);
    previewUrl = url;
    return () => URL.revokeObjectURL(url);
  });

  async function onSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    error = "";
    try {
      const bytes = await loadAndCompress(
        file,
        maxSide,
        format.type,
        format.quality,
      );
      value = { vfsPath, bytes };
    } catch (err) {
      error = err instanceof Error ? err.message : String(err);
    } finally {
      // Reset so the same file can be re-selected after a clear.
      input.value = "";
    }
  }

  function clear() {
    value = null;
  }

  async function loadAndCompress(
    file: File,
    max: number,
    mimeType: string,
    q: number,
  ): Promise<Uint8Array> {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * ratio));
    const h = Math.max(1, Math.round(bitmap.height * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas 2d context が利用できません");
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, mimeType, q),
    );
    if (!blob) throw new Error("画像のエンコードに失敗しました");
    return new Uint8Array(await blob.arrayBuffer());
  }
</script>

<div class="flex flex-col items-start gap-2">
  {#if previewUrl}
    <img
      src={previewUrl}
      alt="プレビュー"
      class="h-[110px] w-[88px] rounded-xs border border-neutral-200 object-cover"
    >
  {:else}
    <!-- 4×3 cm photo placeholder. The diagonal stripe pattern signals "drop
         target" and matches the 4:3 ratio of a Japanese ID photo. -->
    <div class="placeholder">4×3 cm</div>
  {/if}
  <input
    bind:this={fileInput}
    type="file"
    accept="image/*"
    onchange={onSelect}
    class="hidden"
  >
  <div class="flex items-center gap-2">
    <Button onclick={() => fileInput?.click()}>ファイルを選択</Button>
    {#if previewUrl}
      <Button variant="subtle" onclick={clear}>削除</Button>
    {/if}
  </div>
  {#if error}
    <p class="text-[12px] text-red-700">{error}</p>
  {/if}
  {#if hint}
    <p class="text-[11px] text-neutral-500">{hint}</p>
  {/if}
</div>

<style>
  /* The diagonal-striped placeholder is too specific to live in a Tailwind
     utility — repeating-linear-gradient + dashed border + monospace label
     are only used here. Scoped styles keep it bound to this component. */
  .placeholder {
    height: 110px;
    width: 88px;
    border: 1px dashed var(--color-neutral-300);
    border-radius: 0.125rem;
    display: grid;
    place-items: center;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--color-neutral-400);
    background: repeating-linear-gradient(
      135deg,
      var(--color-neutral-50) 0 8px,
      #f4f4f4 8px 9px
    );
  }
</style>
