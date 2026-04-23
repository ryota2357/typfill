import { describe, expect, it } from "vitest";
import { nextMonthEnd } from "./defaults";

describe("nextMonthEnd", () => {
  it("returns the last day of the month after the given date", () => {
    expect(nextMonthEnd(new Date(2026, 3, 23))).toEqual({
      year: 2026,
      month: 5,
      day: 31,
    });
  });

  it("rolls over the year when given December", () => {
    expect(nextMonthEnd(new Date(2025, 11, 15))).toEqual({
      year: 2026,
      month: 1,
      day: 31,
    });
  });

  it("lands on Feb 29 for a leap-year input in January", () => {
    expect(nextMonthEnd(new Date(2024, 0, 10))).toEqual({
      year: 2024,
      month: 2,
      day: 29,
    });
  });

  it("lands on Feb 28 for a non-leap-year input in January", () => {
    expect(nextMonthEnd(new Date(2025, 0, 10))).toEqual({
      year: 2025,
      month: 2,
      day: 28,
    });
  });
});
