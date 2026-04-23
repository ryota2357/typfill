<script lang="ts">
  import MarkupTextarea from "$lib/components/forms/MarkupTextarea.svelte";
  import TimelineForm from "$lib/components/forms/TimelineForm.svelte";
  import type { TimelineField } from "$lib/components/forms/_helpers";
  import TemplateEditor from "$lib/components/TemplateEditor.svelte";
  import * as template from "$lib/templates/invoice";
  import { buildInvoiceFilename } from "./filename";
  import ImportDialog from "./ImportDialog.svelte";

  // TODO(phase-5+): once invoice `lib.typ` lands, flesh out dedicated forms
  // for recipient/issuer/account/due-date etc. This page currently ships a
  // minimal skeleton so the TemplateEditor + preview pipeline can be verified
  // end-to-end on the stub main.typ.
  const ITEM_FIELDS: readonly TimelineField<template.InvoiceItem>[] = [
    { key: "name", label: "品目", type: "text", width: "1fr" },
    { key: "amount", label: "数量", type: "number", width: "6em", min: 0 },
    { key: "unit", label: "単位", type: "text", width: "6em" },
    { key: "price", label: "単価", type: "number", width: "8em", min: 0 },
  ];

  function loadInitial(): template.Fields {
    if (typeof localStorage === "undefined") return template.EMPTY_FIELDS;
    const raw = localStorage.getItem(template.storageKey);
    if (!raw) return template.EMPTY_FIELDS;
    return template.deserialize(raw) ?? template.EMPTY_FIELDS;
  }

  let data = $state<template.Fields>(loadInitial());

  let importPayload = $state<template.Fields | null>(null);
  let importError = $state("");

  const filename = $derived(buildInvoiceFilename(data));

  function onImport(payload: string) {
    const next = template.deserialize(payload);
    if (next) importPayload = next;
    else importError = "共有リンクを読み込めませんでした";
  }

  function onImportAccept(next: template.Fields) {
    data = next;
    importPayload = null;
  }

  function onImportCancel() {
    importPayload = null;
  }

  function onReset() {
    data = structuredClone(template.EMPTY_FIELDS);
    try {
      localStorage.removeItem(template.storageKey);
    } catch {
      // ignore
    }
  }
</script>

<TemplateEditor
  {data}
  {template}
  {filename}
  {importError}
  onimport={onImport}
  onreset={onReset}
>
  <div class="space-y-6">
    <section class="rounded border border-orange-200 bg-orange-50 p-3 text-sm text-orange-900">
      ⚠ 請求書テンプレートは準備中です。現時点ではデータ入力のみ可能で、プレビューは仮表示です。
    </section>

    <label class="block space-y-1">
      <span class="text-sm text-gray-700">タイトル</span>
      <input
        type="text"
        bind:value={data.title}
        class="w-full rounded border border-gray-300 px-2 py-1"
      >
    </label>

    <TimelineForm
      label="項目"
      items={data.items}
      newEntry={template.newInvoiceItem}
      fields={ITEM_FIELDS}
    />

    <MarkupTextarea label="備考" bind:value={data.body} />
  </div>
</TemplateEditor>

{#if importPayload}
  <ImportDialog
    imported={importPayload}
    hasExisting={typeof localStorage !== "undefined" &&
      localStorage.getItem(template.storageKey) !== null}
    onaccept={onImportAccept}
    oncancel={onImportCancel}
  />
{/if}
