<script lang="ts">
  import { Field, Section, TextInput } from "$lib/components/forms";
  import type { Party } from "$lib/templates/invoice";

  // Used twice (請求先 / 請求元). Internal field writes flow through
  // Svelte 5's deep proxy, so `value` is enough; no `bind:` from the parent.
  let { label, value }: { label: string; value: Party } = $props();
</script>

<Section title={label} cols={2}>
  <Field label="名前 / 会社名" span="full">
    <TextInput bind:value={value.name} />
  </Field>
  <Field label="郵便番号">
    <TextInput bind:value={value["postal-code"]} />
  </Field>
  <div class="hidden sm:block"></div>
  <Field label="住所" span="full">
    <TextInput bind:value={value.address} />
  </Field>
</Section>
