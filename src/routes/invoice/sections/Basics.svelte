<script lang="ts">
  import {
    DateInput,
    DateModeRadio,
    Field,
    Section,
    TextInput,
  } from "$lib/components/forms";
  import type { Fields } from "$lib/templates/invoice";

  interface Props {
    data: Fields;
  }
  let { data }: Props = $props();
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
