<script lang="ts">
  import { DateModeRadio, Section } from "$lib/components/forms";
  import type { Fields } from "$lib/templates/resume";

  // `bind:` because the underlying value type swaps between `"auto"` and
  // `DateRecord` — the parent's `data.日付` is replaced wholesale on toggle.
  let { value = $bindable() }: { value: Fields["日付"] } = $props();
</script>

<Section title="作成日付"><DateModeRadio bind:value /></Section>
