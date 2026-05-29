<script lang="ts">
  import type { Attachment } from "svelte/attachments";
  import type { PageDims } from "./svg-pages";

  // SVG is rendered inside a sandboxed `<iframe srcdoc>` rather than inlined
  // via `{@html}` because `rawMarkupLit` fields let share-URL authors emit
  // arbitrary Typst — the resulting SVG can include attacker-controlled
  // `<a xlink:href="javascript:...">`, `<foreignObject>` HTML, and typst.ts's
  // own bundled `<script>`. Without `allow-scripts` / `allow-same-origin`
  // those become inert at the browser level (no DOM sanitization needed),
  // while `<use>` glyphs and `<foreignObject>` text remain selectable.
  // `allow-popups` + `allow-popups-to-escape-sandbox` let legit external
  // `<a target="_blank">` still open as normal pages.
  const SANDBOX = "allow-popups allow-popups-to-escape-sandbox";

  interface Props {
    svg: string;
    // Parsed once by the parent (Preview) and passed down, so page geometry is
    // read from a single source. `null` when the SVG can't be measured.
    pageDims: PageDims | null;
  }
  let { svg, pageDims }: Props = $props();

  let iframeHeight = $state(0);

  // Must stay in sync with the iframe srcdoc CSS below — the height estimate
  // adds these as fixed pixels independent of page scale.
  const PAGE_GAP_PX = 12;
  const BODY_PADDING_PX = 16;

  const srcdoc = $derived(buildSrcdoc(svg));

  function buildSrcdoc(svgText: string): string {
    return [
      "<!doctype html>",
      '<html><head><meta charset="utf-8"><style>',
      "html,body{margin:0;padding:0;background:#fafafa}",
      `body{display:flex;flex-direction:column;align-items:center;padding:${BODY_PADDING_PX / 2}px;gap:${PAGE_GAP_PX}px}`,
      "svg{display:block;max-width:100%;height:auto;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1)}",
      "</style></head><body>",
      svgText,
      "</body></html>",
    ].join("");
  }

  // Iframes don't auto-size, and `sandbox` without `allow-scripts` rules out a
  // postMessage resize from inside. Mirror the srcdoc's `max-width:100%` page
  // scale against the iframe's own width to compute the height. As an
  // attachment the ResizeObserver is bound to the iframe's lifecycle and
  // re-runs whenever `pageDims` changes (a new compile → new page geometry).
  const sizeToContent: Attachment<HTMLIFrameElement> = (el) => {
    const dims = pageDims;
    if (!dims) {
      iframeHeight = 0;
      return;
    }
    const recompute = (width: number) => {
      if (width <= 0) return;
      const renderedWidth = Math.min(width, dims.pageWidth);
      const scale = renderedWidth / dims.pageWidth;
      const gap = (dims.pageCount - 1) * PAGE_GAP_PX;
      iframeHeight = scale * dims.totalHeight + gap + BODY_PADDING_PX;
    };
    recompute(el.clientWidth);
    const obs = new ResizeObserver((entries) => {
      recompute(entries[0].contentRect.width);
    });
    obs.observe(el);
    return () => obs.disconnect();
  };
</script>

<iframe
  title="Typst preview"
  {srcdoc}
  sandbox={SANDBOX}
  style:height={iframeHeight ? `${iframeHeight}px` : "100%"}
  class="block w-full border-0"
  {@attach sizeToContent}
></iframe>
