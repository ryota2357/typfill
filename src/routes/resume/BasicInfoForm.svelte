<script lang="ts">
  import DateInput from "$lib/components/forms/DateInput.svelte";
  import DateModeRadio from "$lib/components/forms/DateModeRadio.svelte";
  import PhotoInput from "$lib/components/forms/PhotoInput.svelte";
  import type { Fields } from "$lib/templates/resume";

  let { data }: { data: Fields } = $props();
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
      <DateInput
        bind:value={data.生年月日}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      />
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
    <DateModeRadio bind:value={data.日付} />
  </fieldset>

  <fieldset class="space-y-2">
    <legend class="text-sm text-gray-700">写真</legend>
    <PhotoInput
      bind:value={data.写真}
      hint="長辺 600px までリサイズし、JPEG（品質 85）として埋め込みます。共有リンクには含まれません。"
    />
  </fieldset>
</section>
