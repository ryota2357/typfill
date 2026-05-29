<script lang="ts">
  import { ImportDialog, TemplateEditor } from "$lib/components";
  import { MarkupField } from "$lib/components/forms";
  import * as template from "$lib/templates/invoice";
  import { createTemplateState } from "$lib/templates/state.svelte";
  import { buildInvoiceFilename } from "./filename";
  import { buildInvoicePreviewItems } from "./preview";
  import Account from "./sections/Account.svelte";
  import Advanced from "./sections/Advanced.svelte";
  import Basics from "./sections/Basics.svelte";
  import Items from "./sections/Items.svelte";
  import Party from "./sections/Party.svelte";

  // Fresh state uses EMPTY_PROPS but overrides the due-date with end of next
  // month — a sensible business default that depends on "now". This applies
  // only when there's no saved state; saved user edits are honored as-is.
  function freshProps(): template.TemplateProps {
    const fresh = structuredClone(template.EMPTY_PROPS);
    fresh["due-date"] = template.nextMonthEnd();
    return fresh;
  }

  const state = createTemplateState(template, freshProps);

  const filename = $derived(buildInvoiceFilename(state.data));
  const previewItems = $derived(
    state.importPayload ? buildInvoicePreviewItems(state.importPayload) : [],
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
  <Party label="請求先" value={state.data.recipient} />
  <Party label="請求元" value={state.data.issuer} />
  <Account value={state.data.account} />
  <Items items={state.data.items} />
  <MarkupField label="備考" bind:value={state.data.body} />
  <Advanced data={state.data} />
</TemplateEditor>

{#if state.importPayload}
  <ImportDialog
    dataLabel="請求書データ"
    hasExisting={state.hasStoredData}
    {previewItems}
    onaccept={state.acceptImport}
    oncancel={state.cancelImport}
  />
{/if}
