<script lang="ts">
  import type { Snippet } from "svelte";

  // Specialized one-off buttons (× in EntryList, dashed "+ 行を追加", radio/tab
  // pills) intentionally render their own `<button>` instead of being added as
  // new variants here.
  interface Props {
    children: Snippet;
    variant?: "primary" | "default" | "subtle" | "ghost";
    size?: "sm" | "md" | "icon";
    type?: "button" | "submit";
    onclick?: (e: MouseEvent) => void;
    disabled?: boolean;
    "aria-label"?: string;
  }
  let {
    children,
    variant = "default",
    size = "sm",
    type = "button",
    onclick,
    disabled = false,
    "aria-label": ariaLabel,
  }: Props = $props();

  const VARIANT = {
    primary:
      "border border-neutral-900 bg-neutral-900 text-white hover:bg-neutral-800",
    default:
      "border border-neutral-200 bg-white text-neutral-900 hover:bg-neutral-50",
    subtle:
      "border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50",
    ghost:
      "border border-transparent bg-transparent text-neutral-500 hover:bg-neutral-100",
  } as const;

  const SIZE = {
    sm: "px-2.5 py-1 text-[12px]",
    md: "px-4 py-1.5 text-[13px] font-semibold",
    icon: "p-1",
  } as const;
</script>

<button
  {type}
  {onclick}
  {disabled}
  aria-label={ariaLabel}
  class={[
    "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-sm whitespace-nowrap transition-colors",
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-inherit",
    VARIANT[variant],
    SIZE[size],
  ]}
>
  {@render children()}
</button>
