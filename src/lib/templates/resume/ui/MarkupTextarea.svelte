<script lang="ts">
  let {
    label,
    value = $bindable(),
    hint,
  }: { label: string; value: string; hint?: string } = $props();
</script>

<section class="space-y-2">
  <h2 class="text-lg font-semibold">{label}</h2>
  <textarea
    bind:value
    rows="5"
    class="w-full rounded border border-gray-300 px-2 py-1 font-mono text-sm"
  ></textarea>
  <p class="text-xs text-gray-500">
    {hint ?? "Typst 記法が使えます: *太字*、#h(1em)、改行は行末に \\ など。"}
  </p>
</section>
