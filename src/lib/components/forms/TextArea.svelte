<script lang="ts">
  let {
    value = $bindable(),
    rows = 5,
    mono = false,
    placeholder,
  }: {
    value: string;
    rows?: number;
    mono?: boolean;
    placeholder?: string;
  } = $props();
</script>

<textarea
  bind:value
  {rows}
  {placeholder}
  class={[
    "w-full rounded-sm border border-neutral-200 bg-white px-2.5 py-2 text-[13px]",
    "focus:border-neutral-900 focus:outline-none",
    mono && "font-mono",
  ]}
></textarea>
