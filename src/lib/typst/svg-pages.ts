// typst.ts emits one `<svg>` root per page, each with explicit `width`/`height`
// (units like `pt`, `px`). The preview needs two things from that markup: how
// many pages there are, and their combined aspect ratio (to size the iframe).
// Both the preview footer (`Preview.svelte`) and the iframe height math
// (`SandboxedSvg.svelte`) read from this single parser so the two can't drift.

export type PageDims = {
  /** Width of the first page; pages are assumed equal-width (A4). */
  pageWidth: number;
  /** Sum of every page's height — only the ratio to `pageWidth` matters. */
  totalHeight: number;
  pageCount: number;
};

// Only the ratio matters downstream, so unit suffixes are dropped and the
// numbers are treated as relative. Falls back to the `viewBox` when `width`/
// `height` attributes are absent.
export function parsePageDims(svgText: string): PageDims | null {
  const opens = [...svgText.matchAll(/<svg\b[^>]*>/g)];
  if (opens.length === 0) return null;
  let pageWidth = 0;
  let totalHeight = 0;
  for (const m of opens) {
    const tag = m[0];
    const w =
      Number.parseFloat(tag.match(/\bwidth="([\d.]+)/)?.[1] ?? "") ||
      Number.parseFloat(
        tag.match(/\bviewBox="[\d.\s-]*?\s([\d.]+)\s+[\d.]+"/)?.[1] ?? "",
      );
    const h =
      Number.parseFloat(tag.match(/\bheight="([\d.]+)/)?.[1] ?? "") ||
      Number.parseFloat(
        tag.match(/\bviewBox="[\d.\s-]*?\s([\d.]+)"/)?.[1] ?? "",
      );
    if (!w || !h) continue;
    if (!pageWidth) pageWidth = w;
    totalHeight += h;
  }
  if (!pageWidth || !totalHeight) return null;
  return { pageWidth, totalHeight, pageCount: opens.length };
}
