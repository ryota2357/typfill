<script lang="ts">
  // GitHub brand guidelines (https://brand.github.com/foundations/logo) forbid
  // modifying the Invertocat mark (color, dimensions). Serve the source SVG
  // byte-identical via <img> to foreclose the `currentColor` recoloring that
  // an inline SVG would expose. `height` is omitted so the browser preserves
  // the 98×96 intrinsic aspect ratio.
  let { size = 14, class: cls = "" }: { size?: number; class?: string } =
    $props();
</script>

<img
  src="/GitHub_Invertocat_Black.svg"
  width={size}
  alt=""
  aria-hidden="true"
  class={cls}
>
