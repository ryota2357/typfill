<script lang="ts">
  import type { Snippet } from "svelte";

  // 3+ columns aren't supported because no current template needs them —
  // extend the grid switch below if a future one does.
  interface Props {
    title: string;
    children: Snippet;
    actions?: Snippet;
    cols?: 1 | 2;
  }
  let { title, children, actions, cols = 1 }: Props = $props();
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
  <div class={cols === 2 ? "grid gap-3 sm:grid-cols-2" : "flex flex-col gap-3"}>
    {@render children()}
  </div>
</section>
