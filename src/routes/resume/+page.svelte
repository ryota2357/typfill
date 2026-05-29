<script lang="ts">
  import { ImportDialog, TemplateEditor } from "$lib/components";
  import { MarkupField } from "$lib/components/forms";
  import * as template from "$lib/templates/resume";
  import { createTemplateState } from "$lib/templates/state.svelte";
  import { buildResumeFilename } from "./filename";
  import { buildResumePreviewItems } from "./preview";
  import Address from "./sections/Address.svelte";
  import Advanced from "./sections/Advanced.svelte";
  import DocumentDate from "./sections/DocumentDate.svelte";
  import PersonalInfo from "./sections/PersonalInfo.svelte";
  import Photo from "./sections/Photo.svelte";
  import Timeline from "./sections/Timeline.svelte";

  const state = createTemplateState(template, () =>
    structuredClone(template.EMPTY_PROPS),
  );

  const filename = $derived(buildResumeFilename(state.data));
  const previewItems = $derived(
    state.importPayload ? buildResumePreviewItems(state.importPayload) : [],
  );
</script>

<TemplateEditor
  data={state.data}
  {template}
  {filename}
  importError={state.importError}
  onimport={state.onImport}
  onreset={state.reset}
  shareExtraNotice={photoNotice}
>
  <PersonalInfo data={state.data} />
  <DocumentDate bind:value={state.data.日付} />
  <Photo bind:value={state.data.写真} />
  <Address label="現住所" value={state.data.現住所} />
  <Address label="連絡先（現住所と異なる場合のみ）" value={state.data.連絡先} />
  <Timeline label="学歴" items={state.data.学歴} />
  <Timeline label="職歴" items={state.data.職歴} />
  <Timeline label="免許・資格" items={state.data["免許・資格"]} />
  <MarkupField label="志望動機" bind:value={state.data.志望動機} />
  <MarkupField label="本人希望記入欄" bind:value={state.data.本人希望記入欄} />
  <Advanced data={state.data} />
</TemplateEditor>

{#snippet photoNotice()}
  {#if state.data.写真 !== null}
    <p
      class="rounded-sm border border-neutral-200 bg-neutral-50 p-2 text-[12px] text-neutral-600"
    >
      共有リンクには写真は含まれません。
    </p>
  {/if}
{/snippet}

{#if state.importPayload}
  <ImportDialog
    dataLabel="履歴書データ"
    hasExisting={state.hasStoredData}
    {previewItems}
    onaccept={state.acceptImport}
    oncancel={state.cancelImport}
  />
{/if}
