<script lang="ts">
  import type { Snippet } from "svelte";

  // Wraps a label above an arbitrary input. Renders a `<label>` so any
  // single child input automatically associates with it; for multi-input
  // groups, render a non-input child (e.g. a div) and the surrounding
  // <label> still acts as a clickable target without binding to a control.
  let {
    label,
    children,
    span,
  }: { label: string; children: Snippet; span?: "full" } = $props();
</script>

<label class="flex flex-col gap-1 {span === 'full' ? 'sm:col-span-2' : ''}">
  <span class="text-[11px] font-medium text-neutral-500">{label}</span>
  {@render children()}
</label>
