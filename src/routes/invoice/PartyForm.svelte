<script lang="ts">
  import { FormField, FormInput, FormSection } from "$lib/components/forms";
  import type { Party } from "$lib/templates/invoice";

  let { label, value }: { label: string; value: Party } = $props();
</script>

<FormSection title={label}>
  <div class="grid gap-3 sm:grid-cols-2">
    <FormField label="名前 / 会社名" span="full">
      <FormInput bind:value={value.name} />
    </FormField>
    <FormField label="郵便番号">
      <FormInput bind:value={value["postal-code"]} />
    </FormField>
    <div class="hidden sm:block"></div>
    <FormField label="住所" span="full">
      <FormInput bind:value={value.address} />
    </FormField>
  </div>
</FormSection>
