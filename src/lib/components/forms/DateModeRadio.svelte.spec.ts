import { flushSync } from "svelte";
import { describe, expect, it } from "vitest";
import { render } from "vitest-browser-svelte";
import DateModeRadio from "./DateModeRadio.svelte";

// Regression: when the parent binding is in "manual" mode, editing the
// inner <input type="date"> must propagate the new date back to the parent.
// Prior bug had two $effects that both subscribed to `value` + `manualDate`,
// so the "external → local" effect ran first on every local edit and
// reverted `manualDate` to the still-stale `value` — making the field
// appear read-only.
describe("DateModeRadio — manual mode editing", () => {
  it("propagates date input edits back to the bound value", async () => {
    let bound: {
      value: "auto" | { year: number; month: number; day: number };
    } = $state({
      value: { year: 2020, month: 1, day: 2 },
    });

    const screen = render(DateModeRadio, {
      props: {
        get value() {
          return bound.value;
        },
        set value(v) {
          bound.value = v;
        },
      },
    });

    const input = screen.container.querySelector(
      'input[type="date"]',
    ) as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input.value).toBe("2020-01-02");

    input.value = "2026-05-16";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    flushSync();

    expect(bound.value).toEqual({ year: 2026, month: 5, day: 16 });
  });
});
