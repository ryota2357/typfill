<script lang="ts">
  import { ImportDialog, TemplateEditor } from "$lib/components";
  import { MarkupField } from "$lib/components/forms";
  import * as template from "$lib/templates/soufujo";
  import { createTemplateState } from "$lib/templates/state.svelte";
  import { buildSoufujoFilename } from "./filename";
  import { buildSoufujoPreviewItems } from "./preview";
  import Basics from "./sections/Basics.svelte";
  import Enclosures from "./sections/Enclosures.svelte";
  import Greeting from "./sections/Greeting.svelte";
  import Recipient from "./sections/Recipient.svelte";
  import Sender from "./sections/Sender.svelte";

  const state = createTemplateState(template, () =>
    structuredClone(template.EMPTY_PROPS),
  );

  const filename = $derived(buildSoufujoFilename(state.data));
  const previewItems = $derived(
    state.importPayload ? buildSoufujoPreviewItems(state.importPayload) : [],
  );
</script>

<TemplateEditor
  data={state.data}
  {template}
  {filename}
  importError={state.importError}
  onimport={state.onImport}
  onreset={state.reset}
>
  <Basics data={state.data} />
  <Recipient value={state.data.宛先} />
  <Sender value={state.data.差出人} />
  <Greeting data={state.data} />
  <MarkupField label="本文" bind:value={state.data.本文} />
  <Enclosures items={state.data.同封物} />
  <MarkupField label="備考" bind:value={state.data.備考} />
</TemplateEditor>

{#if state.importPayload}
  <ImportDialog
    dataLabel="送付状データ"
    hasExisting={state.hasStoredData}
    {previewItems}
    onaccept={state.acceptImport}
    oncancel={state.cancelImport}
  />
{/if}
