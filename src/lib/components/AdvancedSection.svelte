<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    title: string;
    children: Snippet;
  }
  let { title, children }: Props = $props();
</script>

<details
  class="mb-7 rounded-sm border border-neutral-200 bg-white px-3.5 py-2.5"
>
  <summary class="cursor-pointer text-[12px] font-semibold text-neutral-600">
    {title}
  </summary>
  <div class="mt-3">{@render children()}</div>
</details>
