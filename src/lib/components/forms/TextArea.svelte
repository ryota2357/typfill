<script lang="ts">
  // Bound textarea sibling to TextInput. `mono` flips the editing surface
  // to the monospace stack — used for free-text Typst markup (志望動機,
  // 備考) where alignment-sensitive characters (`-`, `==`, `*`, raw
  // blocks) read better in a fixed-width font.
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
