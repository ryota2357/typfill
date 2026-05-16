<script lang="ts">
  import { Field, Section, TextInput } from "$lib/components/forms";
  import type { Party } from "$lib/templates/invoice";

  interface Props {
    label: string;
    value: Party;
  }
  let { label, value }: Props = $props();
</script>

<Section title={label} cols={2}>
  <Field label="名前 / 会社名" span="full">
    <TextInput bind:value={value.name} />
  </Field>
  <Field label="郵便番号">
    <TextInput
      type="text"
      autocomplete="postal-code"
      bind:value={value["postal-code"]}
    />
  </Field>
  <div class="hidden sm:block"></div>
  <Field label="住所" span="full">
    <TextInput bind:value={value.address} />
  </Field>
</Section>
