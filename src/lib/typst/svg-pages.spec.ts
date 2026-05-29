import { describe, expect, it } from "vitest";
import { parsePageDims } from "./svg-pages";

describe("parsePageDims", () => {
  it("reads width/height from a single <svg> root", () => {
    const svg = '<svg width="595.28pt" height="841.89pt"><g/></svg>';
    expect(parsePageDims(svg)).toEqual({
      pageWidth: 595.28,
      totalHeight: 841.89,
      pageCount: 1,
    });
  });

  it("sums heights across pages and counts them", () => {
    const svg =
      '<svg width="100" height="200"></svg>' +
      '<svg width="100" height="150"></svg>';
    expect(parsePageDims(svg)).toEqual({
      pageWidth: 100,
      totalHeight: 350,
      pageCount: 2,
    });
  });

  it("falls back to viewBox when width/height attributes are absent", () => {
    const svg = '<svg viewBox="0 0 300 400"><g/></svg>';
    expect(parsePageDims(svg)).toEqual({
      pageWidth: 300,
      totalHeight: 400,
      pageCount: 1,
    });
  });

  it("returns null when there is no <svg> root", () => {
    expect(parsePageDims("<div>not svg</div>")).toBeNull();
    expect(parsePageDims("")).toBeNull();
  });

  it("returns null when no page yields usable dimensions", () => {
    expect(parsePageDims("<svg><g/></svg>")).toBeNull();
  });
});
