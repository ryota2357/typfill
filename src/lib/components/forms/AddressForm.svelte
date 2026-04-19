<script module lang="ts">
  // The fixed shape this form edits. Templates whose contact-like records
  // share these keys can pass them in directly; structurally-different
  // records (e.g. invoice's Party) need their own form rather than being
  // squeezed into this one.
  export type AddressFormValue = {
    郵便番号: string;
    住所: string;
    住所ふりがな: string;
    電話: string;
    "E-mail": string;
  };
</script>

<script lang="ts">
  let { label, value }: { label: string; value: AddressFormValue } = $props();
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
      >
    </label>
    <label class="block sm:col-span-2">
      <span class="text-sm text-gray-700">住所</span>
      <input
        type="text"
        bind:value={value.住所}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      >
    </label>
    <label class="block sm:col-span-2">
      <span class="text-sm text-gray-700">住所（ふりがな）</span>
      <input
        type="text"
        bind:value={value.住所ふりがな}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      >
    </label>
    <label class="block">
      <span class="text-sm text-gray-700">電話</span>
      <input
        type="tel"
        bind:value={value.電話}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      >
    </label>
    <label class="block">
      <span class="text-sm text-gray-700">E-mail</span>
      <input
        type="email"
        bind:value={value["E-mail"]}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      >
    </label>
  </div>
</section>
