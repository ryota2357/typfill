<script lang="ts">
  import { Field, Section, TextInput } from "$lib/components/forms";
  import type { Sender } from "$lib/templates/soufujo";

  interface Props {
    value: Sender;
  }
  let { value }: Props = $props();
</script>

<Section title="差出人" cols={2}>
  <Field label="郵便番号">
    <TextInput autocomplete="postal-code" bind:value={value.郵便番号} />
  </Field>
  <div class="hidden sm:block"></div>
  <Field label="住所" span="full">
    <TextInput bind:value={value.住所} />
  </Field>
  <Field label="会社名" span="full">
    <TextInput bind:value={value.会社名} />
  </Field>
  <Field label="部署"><TextInput bind:value={value.部署} /></Field>
  <Field label="氏名"><TextInput bind:value={value.氏名} /></Field>
  <Field label="電話">
    <TextInput type="text" autocomplete="tel" bind:value={value.電話} />
  </Field>
  <Field label="E-mail">
    <TextInput type="email" autocomplete="email" bind:value={value["E-mail"]} />
  </Field>
</Section>
