<script lang="ts">
  import type { Snippet } from "svelte";

  // Modal frame: backdrop + centered card + Escape-to-close + ARIA wiring.
  // The title row optionally accepts a `titleActions` snippet — used for
  // the icon-only close affordance on ShareDialog. ImportDialog omits it
  // and surfaces close as a "キャンセル" / "読み込む" button pair in the
  // children body instead.
  let {
    title,
    onclose,
    size = "md",
    titleActions,
    children,
  }: {
    title: string;
    onclose: () => void;
    size?: "md" | "lg";
    titleActions?: Snippet;
    children: Snippet;
  } = $props();

  // Per-instance id so multiple stacked dialogs don't collide on the
  // labelledby reference.
  const titleId = $props.id();

  const FRAME_SIZE = {
    md: "max-w-md",
    lg: "max-w-lg",
  } as const;

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") onclose();
  }
</script>

<svelte:window onkeydown={onKey} />

<div
  class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
  role="dialog"
  aria-modal="true"
  aria-labelledby={titleId}
>
  <div
    class={[
      "flex w-full flex-col gap-4 rounded-md border border-neutral-200 bg-white p-5 shadow-xl",
      FRAME_SIZE[size],
    ]}
  >
    <div class="flex items-start justify-between gap-3">
      <h2 id={titleId} class="text-[16px] font-bold">{title}</h2>
      {#if titleActions}
        {@render titleActions()}
      {/if}
    </div>
    {@render children()}
  </div>
</div>
