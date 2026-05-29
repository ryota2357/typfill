<script lang="ts">
  import { Field, Section, TextInput } from "$lib/components/forms";
  import type { Account } from "$lib/templates/invoice";

  interface Props {
    value: Account;
  }
  let { value }: Props = $props();
</script>

<Section title="振込先" cols={2}>
  <Field label="銀行名" span="full">
    <TextInput bind:value={value.bank} />
  </Field>
  <Field label="支店名"><TextInput bind:value={value.branch} /></Field>
  <Field label="口座種別"><TextInput bind:value={value.type} /></Field>
  <Field label="口座番号">
    <TextInput inputmode="numeric" bind:value={value.number} />
  </Field>
  <Field label="口座名義"><TextInput bind:value={value.holder} /></Field>
</Section>
