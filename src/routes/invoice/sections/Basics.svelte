<script lang="ts">
  import {
    DateInput,
    DateModeRadio,
    Field,
    Section,
    TextInput,
  } from "$lib/components/forms";
  import type { Fields } from "$lib/templates/invoice";

  // Bundles four top-level fields (title / invoice-number-series / due-date
  // / date) under one heading. `data` flows in whole because each field is
  // a different shape.
  let { data }: { data: Fields } = $props();
</script>

<Section title="基本情報">
  <div class="grid gap-3 sm:grid-cols-2">
    <Field label="タイトル" span="full">
      <TextInput bind:value={data.title} />
    </Field>
    <Field label="請求書番号（連番）">
      <TextInput
        type="number"
        min={1}
        bind:value={data["invoice-number-series"]}
      />
    </Field>
    <Field label="支払期限">
      <DateInput bind:value={data["due-date"]} />
    </Field>
    <Field label="発行日" span="full">
      <DateModeRadio bind:value={data.date} />
    </Field>
  </div>
</Section>
