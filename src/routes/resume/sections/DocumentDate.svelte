<script lang="ts">
  import { DateModeRadio, Section } from "$lib/components/forms";
  import type { Fields } from "$lib/templates/resume";

  let { value = $bindable() }: { value: Fields["日付"] } = $props();
</script>

<Section title="作成日付"><DateModeRadio bind:value /></Section>
