<script lang="ts">
  import {
    DateModeRadio,
    Field,
    Section,
    TextInput,
  } from "$lib/components/forms";
  import type { TemplateProps } from "$lib/templates/soufujo";

  interface Props {
    data: TemplateProps;
  }
  let { data }: Props = $props();
</script>

<Section title="基本情報">
  <div class="grid gap-3 sm:grid-cols-2">
    <Field label="件名" span="full">
      <TextInput bind:value={data.件名} />
    </Field>
    <Field label="日付" span="full">
      <DateModeRadio bind:value={data.日付} />
    </Field>
  </div>
</Section>
