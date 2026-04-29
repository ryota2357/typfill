<script lang="ts">
  import { Field, Section, TextInput } from "$lib/components/forms";
  import type { Contact } from "$lib/templates/resume";

  // Used twice on the page (現住所 / 連絡先) — the section title varies, so
  // `label` is exposed. Internal field writes flow through Svelte 5's deep
  // proxy, so `value` is enough; no `bind:` from the parent.
  let { label, value }: { label: string; value: Contact } = $props();
</script>

<Section title={label} cols={2}>
  <Field label="郵便番号"><TextInput bind:value={value.郵便番号} /></Field>
  <div class="hidden sm:block"></div>
  <Field label="住所" span="full"><TextInput bind:value={value.住所} /></Field>
  <Field label="住所（ふりがな）" span="full">
    <TextInput bind:value={value.住所ふりがな} />
  </Field>
  <Field label="電話"> <TextInput type="tel" bind:value={value.電話} /> </Field>
  <Field label="E-mail">
    <TextInput type="email" bind:value={value["E-mail"]} />
  </Field>
</Section>
