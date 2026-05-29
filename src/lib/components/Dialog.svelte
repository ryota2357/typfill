<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";

  interface Props {
    title: string;
    onclose: () => void;
    size?: "md" | "lg";
    titleActions?: Snippet;
    children: Snippet;
    // Off for confirmations where an accidental dismiss is costly (e.g. the
    // share-import dialog, where re-opening means re-visiting the link).
    closeOnBackdropClick?: boolean;
  }
  let {
    title,
    onclose,
    size = "md",
    titleActions,
    children,
    closeOnBackdropClick = true,
  }: Props = $props();

  // Per-instance id so stacked dialogs don't collide on `aria-labelledby`.
  const titleId = $props.id();

  const FRAME_SIZE = {
    md: "max-w-md",
    lg: "max-w-lg",
  } as const;

  // A native modal `<dialog>` gives a focus trap, an inert background, and
  // focus restoration for free — none of which the previous div overlay had.
  // `showModal()` must run once the element is in the DOM, so an attachment
  // opens it on mount and closes it on teardown; the explicit `close()` also
  // restores focus on the close paths that don't go through Escape.
  const modal: Attachment<HTMLDialogElement> = (el) => {
    if (!el.open) el.showModal();
    return () => el.close();
  };

  // The backdrop belongs to the <dialog>, so clicking it lands on the element
  // itself; clicks inside the frame land on its descendants.
  function onBackdropClick(e: MouseEvent) {
    if (closeOnBackdropClick && e.target === e.currentTarget) onclose();
  }
</script>

<dialog
  aria-labelledby={titleId}
  oncancel={onclose}
  onclick={onBackdropClick}
  class={[
    "m-auto w-[calc(100%-2rem)] border-0 bg-transparent p-0",
    FRAME_SIZE[size],
  ]}
  {@attach modal}
>
  <div
    class="flex max-h-[calc(100dvh-2rem)] w-full flex-col gap-4 overflow-y-auto rounded-md border border-neutral-200 bg-white p-5 shadow-xl"
  >
    <div class="flex items-start justify-between gap-3">
      <h2 id={titleId} class="text-[16px] font-bold">{title}</h2>
      {#if titleActions}
        {@render titleActions()}
      {/if}
    </div>
    {@render children()}
  </div>
</dialog>

<style>
  /* ::backdrop can't reliably inherit custom properties across browsers, so the
           dim overlay uses a literal color rather than a Tailwind utility. */
  dialog::backdrop {
    background: rgb(0 0 0 / 0.4);
  }
</style>
