<script lang="ts">
  import { FormField, FormInput, FormSection } from "$lib/components/forms";
  import type { Contact } from "$lib/templates/resume";

  let { label, value }: { label: string; value: Contact } = $props();
</script>

<FormSection title={label}>
  <div class="grid gap-3 sm:grid-cols-2">
    <FormField label="郵便番号">
      <FormInput bind:value={value.郵便番号} />
    </FormField>
    <div class="hidden sm:block"></div>
    <FormField label="住所" span="full">
      <FormInput bind:value={value.住所} />
    </FormField>
    <FormField label="住所（ふりがな）" span="full">
      <FormInput bind:value={value.住所ふりがな} />
    </FormField>
    <FormField label="電話">
      <FormInput type="tel" bind:value={value.電話} />
    </FormField>
    <FormField label="E-mail">
      <FormInput type="email" bind:value={value["E-mail"]} />
    </FormField>
  </div>
</FormSection>
