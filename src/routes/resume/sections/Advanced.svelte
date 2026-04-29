<script lang="ts">
  import AdvancedSection from "$lib/components/AdvancedSection.svelte";
  import { Field, TextInput } from "$lib/components/forms";
  import type { Fields } from "$lib/templates/resume";

  // Five layout-tweak fields the casual user never opens. Touches multiple
  // top-level keys, so the section receives the whole `data` rather than
  // five separate slices.
  let { data }: { data: Fields } = $props();
</script>

<AdvancedSection title="詳細設定（レイアウト調整）">
  <p class="mb-3 text-[11px] text-neutral-500">
    テンプレートのレイアウト微調整。長さ単位は
    <code class="font-mono text-[11px]">em / pt / mm / cm / in / %</code>
    が使えます。
  </p>
  <div class="grid gap-3 sm:grid-cols-2">
    <Field label="学歴・職歴の最小行数">
      <TextInput
        type="number"
        min={1}
        bind:value={data["学歴・職歴の最小行数"]}
      />
    </Field>
    <Field label="学歴と職歴の間の空行数">
      <TextInput
        type="number"
        min={0}
        bind:value={data.学歴と職歴の間の空行数}
      />
    </Field>
    <Field label="免許・資格の最小行数">
      <TextInput
        type="number"
        min={1}
        bind:value={data["免許・資格の最小行数"]}
      />
    </Field>
    <Field label="志望動機の高さ">
      <TextInput placeholder="22em" bind:value={data.志望動機の高さ} />
    </Field>
    <Field label="本人希望記入欄の高さ">
      <TextInput placeholder="10em" bind:value={data.本人希望記入欄の高さ} />
    </Field>
  </div>
</AdvancedSection>
