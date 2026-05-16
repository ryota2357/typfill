<script lang="ts">
  // GitHub's official Invertocat mark, served as the unmodified file shipped
  // in the GitHub Brand Toolkit (static/GitHub_Invertocat_Black.svg). The
  // brand guidelines (https://brand.github.com/foundations/logo) prohibit
  // modifying the logo — including changing color or dimensions — so we keep
  // the source SVG byte-identical and render it via <img>, which forecloses
  // the `currentColor` recoloring path that an inline SVG would expose.
  //
  // `width` is set from `size` (px); `height` is omitted so the browser
  // preserves the 98×96 intrinsic aspect ratio (uniform scaling, not stretch).
  let { size = 14, class: cls = "" }: { size?: number; class?: string } =
    $props();
</script>

<img
  src="/GitHub_Invertocat_Black.svg"
  width={size}
  alt=""
  aria-hidden="true"
  class={cls}
/>
