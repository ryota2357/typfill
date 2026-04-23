<script module lang="ts">
  export type PhotoValue = { vfsPath: string; bytes: Uint8Array };
</script>

<script lang="ts">
  let {
    value = $bindable(),
    vfsPath = "/assets/photo.jpg",
    maxSide = 600,
    quality = 0.85,
    hint,
  }: {
    value: PhotoValue | null;
    vfsPath?: string;
    maxSide?: number;
    quality?: number;
    hint?: string;
  } = $props();

  let previewUrl = $state<string | null>(null);
  let error = $state("");

  $effect(() => {
    if (!value) {
      previewUrl = null;
      return;
    }
    const blob = new Blob([value.bytes as BlobPart], { type: "image/jpeg" });
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
      const bytes = await loadAndCompress(file, maxSide, quality);
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
      canvas.toBlob(resolve, "image/jpeg", q),
    );
    if (!blob) throw new Error("JPEG のエンコードに失敗しました");
    return new Uint8Array(await blob.arrayBuffer());
  }
</script>

<div class="space-y-2">
  {#if previewUrl}
    <div class="flex items-center gap-3">
      <img
        src={previewUrl}
        alt="プレビュー"
        class="h-32 w-24 rounded border border-gray-300 object-cover"
      >
      <button
        type="button"
        onclick={clear}
        class="rounded border border-red-300 px-2 py-1 text-sm text-red-700 hover:bg-red-50"
      >
        削除
      </button>
    </div>
  {/if}
  <input type="file" accept="image/*" onchange={onSelect} class="block text-sm">
  {#if error}
    <p class="text-sm text-red-700">{error}</p>
  {/if}
  {#if hint}
    <p class="text-xs text-gray-500">{hint}</p>
  {/if}
</div>
