<script lang="ts">
  import type { Contact } from "../types";

  // `value` is a $state proxy mutated in place; no `bind:` plumbing needed for
  // the object as a whole, only for the primitive inputs below.
  let { label, value }: { label: string; value: Contact } = $props();
</script>

<section class="space-y-2">
  <h2 class="text-lg font-semibold">{label}</h2>
  <div class="grid gap-2 sm:grid-cols-2">
    <label class="block">
      <span class="text-sm text-gray-700">郵便番号</span>
      <input
        type="text"
        bind:value={value.郵便番号}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      />
    </label>
    <label class="block sm:col-span-2">
      <span class="text-sm text-gray-700">住所</span>
      <input
        type="text"
        bind:value={value.住所}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      />
    </label>
    <label class="block sm:col-span-2">
      <span class="text-sm text-gray-700">住所（ふりがな）</span>
      <input
        type="text"
        bind:value={value.住所ふりがな}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      />
    </label>
    <label class="block">
      <span class="text-sm text-gray-700">電話</span>
      <input
        type="tel"
        bind:value={value.電話}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      />
    </label>
    <label class="block">
      <span class="text-sm text-gray-700">E-mail</span>
      <input
        type="email"
        bind:value={value["E-mail"]}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      />
    </label>
  </div>
</section>
