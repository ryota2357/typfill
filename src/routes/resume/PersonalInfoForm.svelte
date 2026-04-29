<script lang="ts">
  import {
    DateInput,
    FormField,
    FormInput,
    FormSection,
  } from "$lib/components/forms";
  import type { Fields } from "$lib/templates/resume";

  let { data }: { data: Fields } = $props();
</script>

<FormSection title="基本情報">
  <div class="grid gap-3 sm:grid-cols-2">
    <FormField label="姓"> <FormInput bind:value={data.氏名.姓} /> </FormField>
    <FormField label="名"> <FormInput bind:value={data.氏名.名} /> </FormField>
    <FormField label="姓（ふりがな）">
      <FormInput bind:value={data.氏名ふりがな.姓} />
    </FormField>
    <FormField label="名（ふりがな）">
      <FormInput bind:value={data.氏名ふりがな.名} />
    </FormField>
    <FormField label="生年月日">
      <DateInput bind:value={data.生年月日} />
    </FormField>
    <FormField label="性別"> <FormInput bind:value={data.性別} /> </FormField>
  </div>
</FormSection>
