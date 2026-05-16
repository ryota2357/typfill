<script lang="ts">
  import { DateInput, Field, Section, TextInput } from "$lib/components/forms";
  import type { Fields } from "$lib/templates/resume";

  interface Props {
    data: Fields;
  }
  let { data }: Props = $props();
</script>

<Section title="基本情報" cols={2}>
  <Field label="姓">
    <TextInput autocomplete="family-name" bind:value={data.氏名.姓} />
  </Field>
  <Field label="名">
    <TextInput autocomplete="given-name" bind:value={data.氏名.名} />
  </Field>
  <Field label="姓（ふりがな）">
    <TextInput autocomplete="off" bind:value={data.氏名ふりがな.姓} />
  </Field>
  <Field label="名（ふりがな）">
    <TextInput autocomplete="off" bind:value={data.氏名ふりがな.名} />
  </Field>
  <Field label="生年月日"><DateInput bind:value={data.生年月日} /></Field>
  <Field label="性別"><TextInput bind:value={data.性別} /></Field>
</Section>
