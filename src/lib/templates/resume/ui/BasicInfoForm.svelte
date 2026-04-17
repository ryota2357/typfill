<script lang="ts">
  import { untrack } from "svelte";
  import { clearResumePhoto, setResumePhoto } from "../state.svelte";
  import type { ResumeData, ResumeDate } from "../types";

  let { data }: { data: ResumeData } = $props();

  const pad = (n: number) => String(n).padStart(2, "0");
  const isoOf = (d: ResumeDate) => `${d.year}-${pad(d.month)}-${pad(d.day)}`;
  const todayDate = (): ResumeDate => {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  };
  function parseIso(v: string): ResumeDate | null {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    return { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  }

  // 生年月日 — single date input bridging the {year,month,day} record.
  let birthIso = $derived(isoOf(data.生年月日));
  function onBirthChange(e: Event) {
    const next = parseIso((e.target as HTMLInputElement).value);
    if (next) data.生年月日 = next;
  }

  // 作成日付 — toggle between `auto` (= today at compile time) and a manual date.
  // Local UI state is initialized from `data.日付` once via `untrack` (we want
  // the initial value, not a reactive subscription); subsequent edits push
  // back via $effect. Re-syncing from external mutations (e.g. a Phase 4
  // LocalStorage import) is out of scope here.
  let dateMode = $state<"auto" | "manual">(
    untrack(() => (data.日付 === "auto" ? "auto" : "manual")),
  );
  let manualDate = $state<ResumeDate>(
    untrack(() => (data.日付 === "auto" ? todayDate() : data.日付)),
  );
  $effect(() => {
    data.日付 = dateMode === "auto" ? "auto" : { ...manualDate };
  });
  let manualIso = $derived(isoOf(manualDate));
  function onManualDateChange(e: Event) {
    const next = parseIso((e.target as HTMLInputElement).value);
    if (next) manualDate = next;
  }

  // 写真 — preview as a blob URL, revoked on swap/clear/destroy.
  let photoUrl = $state<string | null>(null);
  $effect(() => {
    if (!data.写真) {
      photoUrl = null;
      return;
    }
    const blob = new Blob([data.写真.bytes as BlobPart], {
      type: "image/jpeg",
    });
    const url = URL.createObjectURL(blob);
    photoUrl = url;
    return () => URL.revokeObjectURL(url);
  });

  let photoError = $state("");
  async function onPhotoSelect(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    photoError = "";
    try {
      const bytes = await loadAndCompress(file, 600, 0.85);
      setResumePhoto(data, bytes);
    } catch (err) {
      photoError = err instanceof Error ? err.message : String(err);
    } finally {
      // Reset so the same file can be re-selected after a clear.
      input.value = "";
    }
  }

  async function loadAndCompress(
    file: File,
    maxSide: number,
    quality: number,
  ): Promise<Uint8Array> {
    const bitmap = await createImageBitmap(file);
    const ratio = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
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
      canvas.toBlob(resolve, "image/jpeg", quality),
    );
    if (!blob) throw new Error("JPEG のエンコードに失敗しました");
    return new Uint8Array(await blob.arrayBuffer());
  }
</script>

<section class="space-y-3">
  <h2 class="text-lg font-semibold">基本情報</h2>

  <div class="grid gap-2 sm:grid-cols-2">
    <label class="block">
      <span class="text-sm text-gray-700">姓</span>
      <input
        type="text"
        bind:value={data.氏名.姓}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      >
    </label>
    <label class="block">
      <span class="text-sm text-gray-700">名</span>
      <input
        type="text"
        bind:value={data.氏名.名}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      >
    </label>
    <label class="block">
      <span class="text-sm text-gray-700">姓（ふりがな）</span>
      <input
        type="text"
        bind:value={data.氏名ふりがな.姓}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      >
    </label>
    <label class="block">
      <span class="text-sm text-gray-700">名（ふりがな）</span>
      <input
        type="text"
        bind:value={data.氏名ふりがな.名}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      >
    </label>
    <label class="block">
      <span class="text-sm text-gray-700">生年月日</span>
      <input
        type="date"
        value={birthIso}
        oninput={onBirthChange}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      >
    </label>
    <label class="block">
      <span class="text-sm text-gray-700">性別</span>
      <input
        type="text"
        bind:value={data.性別}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      >
    </label>
  </div>

  <fieldset class="space-y-2">
    <legend class="text-sm text-gray-700">作成日付</legend>
    <div class="flex flex-wrap items-center gap-3">
      <label class="flex items-center gap-1">
        <input type="radio" bind:group={dateMode} value="auto">
        <span>本日（自動）</span>
      </label>
      <label class="flex items-center gap-1">
        <input type="radio" bind:group={dateMode} value="manual">
        <span>指定する</span>
      </label>
      {#if dateMode === "manual"}
        <input
          type="date"
          value={manualIso}
          oninput={onManualDateChange}
          class="rounded border border-gray-300 px-2 py-1"
        >
      {/if}
    </div>
  </fieldset>

  <fieldset class="space-y-2">
    <legend class="text-sm text-gray-700">写真</legend>
    {#if photoUrl}
      <div class="flex items-center gap-3">
        <img
          src={photoUrl}
          alt="写真プレビュー"
          class="h-32 w-24 rounded border border-gray-300 object-cover"
        >
        <button
          type="button"
          onclick={() => clearResumePhoto(data)}
          class="rounded border border-red-300 px-2 py-1 text-sm text-red-700 hover:bg-red-50"
        >
          削除
        </button>
      </div>
    {/if}
    <input
      type="file"
      accept="image/*"
      onchange={onPhotoSelect}
      class="block text-sm"
    >
    {#if photoError}
      <p class="text-sm text-red-700">{photoError}</p>
    {/if}
    <p class="text-xs text-gray-500">
      長辺 600px までリサイズし、JPEG（品質
      85）として埋め込みます。共有リンクには含まれません。
    </p>
  </fieldset>
</section>
