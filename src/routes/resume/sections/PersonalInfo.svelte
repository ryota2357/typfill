<script lang="ts">
  import { DateInput, Field, Section, TextInput } from "$lib/components/forms";
  import type { Fields } from "$lib/templates/resume";

  // Touches four top-level fields (氏名 / 氏名ふりがな / 生年月日 / 性別)
  // that the resume groups together as "basic info"; passing the whole
  // `data` is simpler than threading four separate slices through a UI
  // grouping that won't be reused elsewhere.
  let { data }: { data: Fields } = $props();
</script>

<Section title="基本情報" cols={2}>
  <Field label="姓"><TextInput bind:value={data.氏名.姓} /></Field>
  <Field label="名"><TextInput bind:value={data.氏名.名} /></Field>
  <Field label="姓（ふりがな）">
    <TextInput bind:value={data.氏名ふりがな.姓} />
  </Field>
  <Field label="名（ふりがな）">
    <TextInput bind:value={data.氏名ふりがな.名} />
  </Field>
  <Field label="生年月日"><DateInput bind:value={data.生年月日} /></Field>
  <Field label="性別"><TextInput bind:value={data.性別} /></Field>
</Section>
