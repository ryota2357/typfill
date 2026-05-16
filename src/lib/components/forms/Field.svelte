<script lang="ts">
  import type { Snippet } from "svelte";

  // For multi-input groups, pass a non-input child (e.g. a div) — the outer
  // <label> stays a click target without auto-binding to any one control.
  interface Props {
    label: string;
    children: Snippet;
    span?: "full";
  }
  let { label, children, span }: Props = $props();
</script>

<label class="flex flex-col gap-1 {span === 'full' ? 'sm:col-span-2' : ''}">
  <span class="text-[11px] font-medium text-neutral-500">{label}</span>
  {@render children()}
</label>
