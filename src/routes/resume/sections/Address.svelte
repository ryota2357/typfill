<script lang="ts">
  import { Field, Section, TextInput } from "$lib/components/forms";
  import type { Contact } from "$lib/templates/resume";

  let { label, value }: { label: string; value: Contact } = $props();
</script>

<Section title={label} cols={2}>
  <Field label="郵便番号">
    <TextInput
      type="text"
      autocomplete="postal-code"
      bind:value={value.郵便番号}
    />
  </Field>
  <div class="hidden sm:block"></div>
  <Field label="住所" span="full">
    <TextInput bind:value={value.住所} />
  </Field>
  <Field label="住所（ふりがな）" span="full">
    <TextInput autocomplete="off" bind:value={value.住所ふりがな} />
  </Field>
  <Field label="電話">
    <TextInput type="text" autocomplete="tel" bind:value={value.電話} />
  </Field>
  <Field label="E-mail">
    <TextInput type="email" autocomplete="email" bind:value={value["E-mail"]} />
  </Field>
</Section>
