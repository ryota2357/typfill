<script lang="ts">
  import type { ResumeData } from "../types";
  import AddressForm from "./AddressForm.svelte";
  import AdvancedParamsForm from "./AdvancedParamsForm.svelte";
  import BasicInfoForm from "./BasicInfoForm.svelte";
  import MarkupTextarea from "./MarkupTextarea.svelte";
  import TimelineForm from "./TimelineForm.svelte";

  let { data }: { data: ResumeData } = $props();
</script>

<div class="space-y-6">
  <BasicInfoForm {data} />
  <AddressForm label="現住所" value={data.現住所} />
  <AddressForm label="連絡先（現住所と異なる場合のみ）" value={data.連絡先} />
  <TimelineForm label="学歴" items={data.学歴} />
  <TimelineForm label="職歴" items={data.職歴} />
  <TimelineForm label="免許・資格" items={data.免許・資格} />
  <MarkupTextarea label="志望動機" bind:value={data.志望動機} />
  <MarkupTextarea label="本人希望記入欄" bind:value={data.本人希望記入欄} />

  <details class="rounded border border-gray-200 p-3">
    <summary class="cursor-pointer text-sm font-semibold text-gray-700">
      詳細設定（レイアウト調整）
    </summary>
    <div class="mt-3">
      <AdvancedParamsForm params={data.params} />
    </div>
  </details>
</div>
