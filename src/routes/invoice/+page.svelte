<script lang="ts">
  import { MarkupField } from "$lib/components/forms";
  import ImportDialog, {
    type PreviewItem,
  } from "$lib/components/ImportDialog.svelte";
  import TemplateEditor from "$lib/components/TemplateEditor.svelte";
  import * as template from "$lib/templates/invoice";
  import { createTemplateState } from "$lib/templates/state.svelte";
  import { buildInvoiceFilename } from "./filename";
  import Account from "./sections/Account.svelte";
  import Advanced from "./sections/Advanced.svelte";
  import Basics from "./sections/Basics.svelte";
  import Items from "./sections/Items.svelte";
  import Party from "./sections/Party.svelte";

  // Fresh state uses EMPTY_FIELDS but overrides the due-date with end of next
  // month — a sensible business default that depends on "now". This applies
  // only when there's no saved state; saved user edits are honored as-is.
  function freshFields(): template.Fields {
    const fresh = structuredClone(template.EMPTY_FIELDS);
    fresh["due-date"] = template.nextMonthEnd();
    return fresh;
  }

  const state = createTemplateState(template, freshFields);

  const filename = $derived(buildInvoiceFilename(state.data));

  function formatDate(d: { year: number; month: number; day: number }): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.year}-${pad(d.month)}-${pad(d.day)}`;
  }

  const previewItems = $derived<readonly PreviewItem[]>(
    state.importPayload === null
      ? []
      : (() => {
          const p = state.importPayload;
          return [
            {
              label: "タイトル",
              value: p.title || "（未設定）",
              format: "break-all",
            },
            {
              label: "発行日",
              value: p.date === "auto" ? "自動（発行時）" : formatDate(p.date),
              format: "tabular",
            },
            {
              label: "支払期限",
              value: formatDate(p["due-date"]),
              format: "tabular",
            },
            {
              label: "請求先",
              value: p.recipient.name || "（未設定）",
              format: "break-all",
            },
            {
              label: "請求元",
              value: p.issuer.name || "（未設定）",
              format: "break-all",
            },
            { label: "項目", value: `${p.items.length} 件` },
          ];
        })(),
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
