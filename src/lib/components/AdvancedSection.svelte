<script lang="ts">
  import type { Snippet } from "svelte";

  // 「詳細設定」 disclosure panel. Both routes have one of these for layout
  // micro-tweaks the casual user never opens — the `<details>` collapses
  // them by default and this component just standardizes the chrome
  // (border, padding, summary type-treatment, body spacing) so the two
  // pages can't drift apart.
  let {
    title,
    children,
  }: {
    title: string;
    children: Snippet;
  } = $props();
</script>

<details
  class="mb-7 rounded-sm border border-neutral-200 bg-white px-3.5 py-2.5"
>
  <summary class="cursor-pointer text-[12px] font-semibold text-neutral-600">
    {title}
  </summary>
  <div class="mt-3">{@render children()}</div>
</details>
