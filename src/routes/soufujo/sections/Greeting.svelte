<script lang="ts">
  import { Field, Section, TextInput } from "$lib/components/forms";
  import type { TemplateProps } from "$lib/templates/soufujo";

  interface Props {
    data: TemplateProps;
  }
  let { data }: Props = $props();
</script>

<Section title="頭語・結語" cols={2}>
  <Field label="頭語（空欄で省略）">
    <TextInput bind:value={data.頭語} />
  </Field>
  <Field label="結語（空欄で省略）">
    <TextInput bind:value={data.結語} />
  </Field>
</Section>
