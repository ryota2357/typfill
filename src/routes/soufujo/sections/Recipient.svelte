<script lang="ts">
  import { Field, Section, TextInput } from "$lib/components/forms";
  import type { Recipient } from "$lib/templates/soufujo";

  interface Props {
    value: Recipient;
  }
  let { value }: Props = $props();
</script>

<Section title="宛先" cols={2}>
  <Field label="会社名" span="full">
    <TextInput bind:value={value.会社名} />
  </Field>
  <Field label="部署"><TextInput bind:value={value.部署} /></Field>
  <Field label="氏名"><TextInput bind:value={value.氏名} /></Field>
  <p class="text-[11px] text-neutral-400 sm:col-span-2">
    氏名があれば「様」、なければ「御中」が付きます。
  </p>
</Section>
