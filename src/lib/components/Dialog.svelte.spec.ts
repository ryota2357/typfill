import { createRawSnippet, flushSync } from "svelte";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import Dialog from "./Dialog.svelte";

// The dialog is a native modal `<dialog>`: it must open itself on mount
// (showModal via the attachment), close on Escape (native `cancel`), and treat
// a click on the backdrop — but not on its contents — as a dismissal.
const content = createRawSnippet(() => ({
  render: () => `<button type="button" data-testid="inside">inside</button>`,
}));

function renderDialog(props?: { closeOnBackdropClick?: boolean }) {
  let closes = 0;
  const screen = render(Dialog, {
    props: {
      title: "テスト",
      onclose: () => closes++,
      children: content,
      ...props,
    },
  });
  const dialog = screen.container.querySelector("dialog") as HTMLDialogElement;
  return { screen, dialog, getCloses: () => closes };
}

describe("Dialog — native modal behavior", () => {
  it("opens itself modally on mount", () => {
    const { dialog } = renderDialog();
    expect(dialog.open).toBe(true);
  });

  it("is centered in the viewport, not pinned to a corner", () => {
    // Regression: Tailwind's preflight resets `margin: 0` on every element,
    // which clobbers the UA's `margin: auto` centering for a modal <dialog>
    // and drops it into the top-left corner. The `m-auto` utility restores it.
    const { dialog } = renderDialog();
    const rect = dialog.getBoundingClientRect();
    const expectedLeft = (window.innerWidth - rect.width) / 2;
    const expectedTop = (window.innerHeight - rect.height) / 2;
    expect(Math.abs(rect.left - expectedLeft)).toBeLessThan(2);
    expect(Math.abs(rect.top - expectedTop)).toBeLessThan(2);
  });

  it("dims the background via the scoped ::backdrop style", () => {
    // Svelte scopes `dialog::backdrop` to the element's hash class; verify the
    // dim actually reaches the top-layer pseudo-element rather than silently
    // falling back to the (transparent) UA default.
    const { dialog } = renderDialog();
    const backdrop = getComputedStyle(dialog, "::backdrop").backgroundColor;
    expect(backdrop).toContain("0, 0, 0");
    expect(backdrop).toContain("0.4");
  });

  it("closes on the native cancel event (Escape)", () => {
    const { dialog, getCloses } = renderDialog();
    dialog.dispatchEvent(new Event("cancel"));
    flushSync();
    expect(getCloses()).toBe(1);
  });

  it("closes when the backdrop (the dialog element itself) is clicked", () => {
    const { dialog, getCloses } = renderDialog();
    dialog.click();
    flushSync();
    expect(getCloses()).toBe(1);
  });

  it("stays open when content inside the frame is clicked", () => {
    const { dialog, getCloses } = renderDialog();
    const inside = dialog.querySelector(
      '[data-testid="inside"]',
    ) as HTMLButtonElement;
    inside.click();
    flushSync();
    expect(getCloses()).toBe(0);
  });

  it("ignores backdrop clicks when closeOnBackdropClick is false", () => {
    const { dialog, getCloses } = renderDialog({ closeOnBackdropClick: false });
    dialog.click();
    flushSync();
    expect(getCloses()).toBe(0);
    // Escape (native cancel) must still dismiss it.
    dialog.dispatchEvent(new Event("cancel"));
    flushSync();
    expect(getCloses()).toBe(1);
  });
});
