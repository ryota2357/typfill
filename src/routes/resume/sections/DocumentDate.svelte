<script lang="ts">
  import { DateModeRadio, Section } from "#lib/components/forms/index.ts";
  import type { PlainDate } from "#lib/templates/resume/index.ts";

  interface Props {
    value: "auto" | PlainDate;
  }
  let { value = $bindable() }: Props = $props();
</script>

<Section title="作成日付"><DateModeRadio bind:value /></Section>
