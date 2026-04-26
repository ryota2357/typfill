<script lang="ts">
  // Renders compiled Typst SVG inside a sandboxed `<iframe srcdoc>` rather
  // than inlining via `{@html}`. `rawMarkupLit` fields let share-URL authors
  // emit arbitrary Typst, whose SVG output can include attacker-controlled
  // `<a xlink:href="javascript:...">`, `<foreignObject>` HTML, and (typst.ts
  // itself bundles a small `<script>` for hover/jump). Inlined into our
  // origin those would expose form data in localStorage to the attacker.
  // The sandbox attribute denies script execution and same-origin access at
  // the browser level, so they become inert without any DOM-level
  // sanitization — which also lets typst.ts's `<use>` glyph references and
  // `<foreignObject>` text overlays survive, keeping text selection / copy
  // / find-in-page working.
  //
  //   allow-popups                   : let `<a target="_blank">` open
  //   allow-popups-to-escape-sandbox : popups load as normal pages so legit
  //                                    external links work
  //
  // Notably absent: allow-scripts, allow-same-origin, allow-forms,
  // allow-top-navigation. Without allow-scripts, `javascript:` hrefs can't
  // evaluate even when clicked.
  const SANDBOX = "allow-popups allow-popups-to-escape-sandbox";

  let { svg }: { svg: string } = $props();

  let iframeEl: HTMLIFrameElement | undefined = $state();
  let iframeHeight = $state(0);

  type PageDims = {
    pageWidth: number;
    totalHeight: number;
    pageCount: number;
  };

  // typst.ts emits one `<svg>` root per page, each with explicit `width` /
  // `height` attributes (units like `pt` or `px`). We only need the ratio,
  // so we strip the unit and treat the numbers as relative.
  function parsePageDims(svgText: string): PageDims | null {
    const opens = [...svgText.matchAll(/<svg\b[^>]*>/g)];
    if (opens.length === 0) return null;
    let pageWidth = 0;
    let totalHeight = 0;
    for (const m of opens) {
      const tag = m[0];
      const w =
        Number.parseFloat(tag.match(/\bwidth="([\d.]+)/)?.[1] ?? "") ||
        Number.parseFloat(
          tag.match(/\bviewBox="[\d.\s\-]*?\s([\d.]+)\s+[\d.]+"/)?.[1] ?? "",
        );
      const h =
        Number.parseFloat(tag.match(/\bheight="([\d.]+)/)?.[1] ?? "") ||
        Number.parseFloat(
          tag.match(/\bviewBox="[\d.\s\-]*?\s([\d.]+)"/)?.[1] ?? "",
        );
      if (!w || !h) continue;
      if (!pageWidth) pageWidth = w;
      totalHeight += h;
    }
    if (!pageWidth || !totalHeight) return null;
    return { pageWidth, totalHeight, pageCount: opens.length };
  }

  // CSS values must stay in sync with the iframe srcdoc below — the height
  // estimate adds these as fixed pixels independent of page scale.
  const PAGE_GAP_PX = 12;
  const BODY_PADDING_PX = 16;

  let pageDims = $derived(parsePageDims(svg));
  let srcdoc = $derived(buildSrcdoc(svg));

  function buildSrcdoc(svgText: string): string {
    return [
      "<!doctype html>",
      '<html><head><meta charset="utf-8"><style>',
      "html,body{margin:0;padding:0;background:#f9fafb}",
      `body{display:flex;flex-direction:column;align-items:center;padding:${BODY_PADDING_PX / 2}px;gap:${PAGE_GAP_PX}px}`,
      "svg{display:block;max-width:100%;height:auto;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,0.1)}",
      "</style></head><body>",
      svgText,
      "</body></html>",
    ].join("");
  }

  // Iframes do not auto-size to their content. `sandbox` without
  // `allow-scripts` rules out a postMessage-based resize from inside, so we
  // compute the rendered height from the page dimensions and the iframe's
  // own width: pages scale to fit the available width (max-width: 100%
  // inside) and we mirror the same scale here.
  $effect(() => {
    const el = iframeEl;
    const dims = pageDims;
    if (!el || !dims) {
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
  });
</script>

<iframe
  bind:this={iframeEl}
  title="Typst preview"
  {srcdoc}
  sandbox={SANDBOX}
  style:height={iframeHeight ? `${iframeHeight}px` : "100%"}
  class="block w-full border-0"
></iframe>
