<script lang="ts">
  import type { HTMLInputAttributes } from "svelte/elements";

  interface Props
    extends Omit<HTMLInputAttributes, "value" | "class" | "style" | "width"> {
    value: string | number;
    width?: number;
    mono?: boolean;
  }

  let {
    value = $bindable(),
    type = "text",
    width,
    mono = false,
    ...rest
  }: Props = $props();
</script>

<input
  {...rest}
  {type}
  bind:value
  style:width={width !== undefined ? `${width}px` : undefined}
  class={["form-input", width === undefined && "w-full", mono && "font-mono"]}
>
