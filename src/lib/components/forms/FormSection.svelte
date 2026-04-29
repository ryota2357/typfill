<script lang="ts">
  import type { Snippet } from "svelte";

  let {
    title,
    children,
    actions,
  }: { title: string; children: Snippet; actions?: Snippet } = $props();
</script>

<section class="mb-7 last:mb-0">
  <div
    class="mb-3 flex items-baseline justify-between gap-2 border-b border-divider pb-1.5"
  >
    <h2 class="text-[12px] font-semibold text-neutral-900">{title}</h2>
    {#if actions}
      {@render actions()}
    {/if}
  </div>
  <div class="flex flex-col gap-3">{@render children()}</div>
</section>
