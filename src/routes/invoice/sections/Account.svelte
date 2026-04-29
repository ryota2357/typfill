<script lang="ts">
  import { Field, Section, TextInput } from "$lib/components/forms";
  import type { Fields } from "$lib/templates/invoice";

  // Bank/branch/type/number/holder all live under `data.account` and only
  // make sense as a unit, so the section receives the whole sub-record.
  let { value }: { value: Fields["account"] } = $props();
</script>

<Section title="振込先" cols={2}>
  <Field label="銀行名" span="full">
    <TextInput bind:value={value.bank} />
  </Field>
  <Field label="支店名"><TextInput bind:value={value.branch} /></Field>
  <Field label="口座種別"><TextInput bind:value={value.type} /></Field>
  <Field label="口座番号"><TextInput bind:value={value.number} /></Field>
  <Field label="口座名義"><TextInput bind:value={value.holder} /></Field>
</Section>
