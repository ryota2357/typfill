<script lang="ts">
  import type { Party } from "$lib/templates/invoice";

  let { label, value }: { label: string; value: Party } = $props();
</script>

<section class="space-y-2">
  <h2 class="text-lg font-semibold">{label}</h2>
  <div class="grid gap-2 sm:grid-cols-2">
    <label class="block sm:col-span-2">
      <span class="text-sm text-gray-700">名前 / 会社名</span>
      <input
        type="text"
        bind:value={value.name}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      >
    </label>
    <label class="block">
      <span class="text-sm text-gray-700">郵便番号</span>
      <input
        type="text"
        bind:value={value["postal-code"]}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      >
    </label>
    <label class="block sm:col-span-2">
      <span class="text-sm text-gray-700">住所</span>
      <input
        type="text"
        bind:value={value.address}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      >
    </label>
  </div>
</section>
