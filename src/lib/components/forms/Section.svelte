<script lang="ts">
  import type { Snippet } from "svelte";

  // Body layout picks itself from `cols`. `1` (default) stacks children
  // vertically — the typical "label / input / label / input" rhythm. `2`
  // switches to a 2-up grid that collapses to 1 column on small screens; used
  // for sections where related fields read better side-by-side (姓/名,
  // 郵便番号/住所, etc.). 3+ columns aren't supported because nothing in the
  // current templates wants them; add a case here when one shows up.
  let {
    title,
    children,
    actions,
    cols = 1,
  }: {
    title: string;
    children: Snippet;
    actions?: Snippet;
    cols?: 1 | 2;
  } = $props();
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
