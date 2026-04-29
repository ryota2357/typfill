<script lang="ts">
  // Bound text-like input. The visual treatment lives in `form-input`
  // (layout.css); this component only owns the binding contract +
  // type-specific attributes. For controlled-mode use, see DateInput —
  // it consumes the same `form-input` utility directly because its value
  // (DateRecord ↔ iso string) cannot round-trip through bind:value.
  let {
    value = $bindable(),
    type = "text",
    placeholder,
    min,
    max,
    step,
    width,
    mono = false,
    disabled = false,
  }: {
    value: string | number;
    type?: "text" | "tel" | "email" | "date" | "number" | "password";
    placeholder?: string;
    min?: number | string;
    max?: number | string;
    step?: number | string;
    // Pixel width for narrow-fit fields (year/month). Omit for full-width.
    width?: number;
    mono?: boolean;
    disabled?: boolean;
  } = $props();
</script>

<input
  {type}
  bind:value
  {placeholder}
  {min}
  {max}
  {step}
  {disabled}
  style:width={width !== undefined ? `${width}px` : undefined}
  class={["form-input", width === undefined && "w-full", mono && "font-mono"]}
>
