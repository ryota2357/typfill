<script lang="ts">
  import { DateModeRadio, Section } from "$lib/components/forms";
  import type { Fields } from "$lib/templates/resume";

  interface Props {
    value: Fields["日付"];
  }
  let { value = $bindable() }: Props = $props();
</script>

<Section title="作成日付"><DateModeRadio bind:value /></Section>
