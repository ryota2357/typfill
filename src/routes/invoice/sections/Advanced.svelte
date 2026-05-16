<script lang="ts">
  import { AdvancedSection } from "$lib/components";
  import { Field, TextInput } from "$lib/components/forms";
  import type { Fields } from "$lib/templates/invoice";

  interface Props {
    data: Fields;
  }
  let { data }: Props = $props();
</script>

<AdvancedSection title="詳細設定（税率・最小行数）">
  <div class="grid gap-3 sm:grid-cols-2">
    <Field label="消費税率（0.1 = 10%）">
      <TextInput
        type="number"
        step={0.01}
        min={0}
        bind:value={data["tax-rate"]}
      />
    </Field>
    <Field label="項目の最小行数">
      <TextInput
        type="number"
        min={0}
        inputmode="numeric"
        bind:value={data["min-item-rows"]}
      />
    </Field>
  </div>
</AdvancedSection>
