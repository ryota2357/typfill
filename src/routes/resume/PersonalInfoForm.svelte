<script lang="ts">
  import { DateInput } from "$lib/components/forms";
  import type { Fields } from "$lib/templates/resume";

  let { data }: { data: Fields } = $props();
</script>

<section class="space-y-3">
  <h2 class="text-lg font-semibold">個人情報</h2>
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
</section>
