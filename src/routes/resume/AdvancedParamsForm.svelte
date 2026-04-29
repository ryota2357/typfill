<script lang="ts">
  import { FormField, FormInput } from "$lib/components/forms";
  import type { Fields } from "$lib/templates/resume";

  let { data }: { data: Fields } = $props();
</script>

<div class="flex flex-col gap-3">
  <p class="text-[11px] text-neutral-500">
    テンプレートのレイアウト微調整。長さ単位は
    <code class="font-mono text-[11px]">em / pt / mm / cm / in / %</code>
    が使えます。
  </p>
  <div class="grid gap-3 sm:grid-cols-2">
    <FormField label="学歴・職歴の最小行数">
      <FormInput
        type="number"
        min={1}
        bind:value={data["学歴・職歴の最小行数"]}
      />
    </FormField>
    <FormField label="学歴と職歴の間の空行数">
      <FormInput
        type="number"
        min={0}
        bind:value={data.学歴と職歴の間の空行数}
      />
    </FormField>
    <FormField label="免許・資格の最小行数">
      <FormInput
        type="number"
        min={1}
        bind:value={data["免許・資格の最小行数"]}
      />
    </FormField>
    <FormField label="志望動機の高さ">
      <FormInput placeholder="22em" bind:value={data.志望動機の高さ} />
    </FormField>
    <FormField label="本人希望記入欄の高さ">
      <FormInput placeholder="10em" bind:value={data.本人希望記入欄の高さ} />
    </FormField>
  </div>
</div>
