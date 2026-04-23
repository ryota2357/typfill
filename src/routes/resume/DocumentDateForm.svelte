<script lang="ts">
  import { DateModeRadio } from "$lib/components/forms";
  import type { Fields } from "$lib/templates/resume";

  let { value = $bindable() }: { value: Fields["日付"] } = $props();
</script>

<section class="space-y-2">
  <h2 class="text-lg font-semibold">作成日付</h2>
  <DateModeRadio bind:value />
</section>
