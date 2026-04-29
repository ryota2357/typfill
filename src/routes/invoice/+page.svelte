<script lang="ts">
  import {
    DateInput,
    DateModeRadio,
    type EntryField,
    EntryListForm,
    FormField,
    FormInput,
    FormSection,
    MarkupTextarea,
  } from "$lib/components/forms";
  import TemplateEditor from "$lib/components/TemplateEditor.svelte";
  import * as template from "$lib/templates/invoice";
  import { buildInvoiceFilename } from "./filename";
  import ImportDialog from "./ImportDialog.svelte";
  import PartyForm from "./PartyForm.svelte";

  const ITEM_FIELDS: readonly EntryField<template.InvoiceItem>[] = [
    { key: "name", label: "品目", type: "text", width: "1fr" },
    { key: "amount", label: "数量", type: "number", width: "6em", min: 0 },
    { key: "unit", label: "単位", type: "text", width: "6em" },
    { key: "price", label: "単価", type: "number", width: "8em", min: 0 },
  ];

  // Fresh invoice state: use the canonical EMPTY_FIELDS but override the
  // due-date with a sensible business default (end of next month) computed at
  // load time. Static data only kicks in when there's no saved state — saved
  // user edits are always honored as-is.
  function freshEmptyFields(): template.Fields {
    const fresh = structuredClone(template.EMPTY_FIELDS);
    fresh["due-date"] = template.nextMonthEnd();
    return fresh;
  }

  function loadInitial(): template.Fields {
    if (typeof localStorage === "undefined") return freshEmptyFields();
    const raw = localStorage.getItem(template.storageKey);
    if (!raw) return freshEmptyFields();
    return template.deserialize(raw) ?? freshEmptyFields();
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
    data = freshEmptyFields();
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
  <FormSection title="基本情報">
    <div class="grid gap-3 sm:grid-cols-2">
      <FormField label="タイトル" span="full">
        <FormInput bind:value={data.title} />
      </FormField>
      <FormField label="請求書番号（連番）">
        <FormInput
          type="number"
          min={1}
          bind:value={data["invoice-number-series"]}
        />
      </FormField>
      <FormField label="支払期限">
        <DateInput bind:value={data["due-date"]} />
      </FormField>
    </div>
    <fieldset class="flex flex-col gap-1.5">
      <legend class="text-[11px] font-medium text-neutral-500">発行日</legend>
      <DateModeRadio bind:value={data.date} />
    </fieldset>
  </FormSection>

  <PartyForm label="請求先" value={data.recipient} />
  <PartyForm label="請求元" value={data.issuer} />

  <FormSection title="振込先">
    <div class="grid gap-3 sm:grid-cols-2">
      <FormField label="銀行名" span="full">
        <FormInput bind:value={data.account.bank} />
      </FormField>
      <FormField label="支店名">
        <FormInput bind:value={data.account.branch} />
      </FormField>
      <FormField label="口座種別">
        <FormInput bind:value={data.account.type} />
      </FormField>
      <FormField label="口座番号">
        <FormInput bind:value={data.account.number} />
      </FormField>
      <FormField label="口座名義">
        <FormInput bind:value={data.account.holder} />
      </FormField>
    </div>
  </FormSection>

  <EntryListForm
    label="項目"
    items={data.items}
    newEntry={template.newInvoiceItem}
    fields={ITEM_FIELDS}
  />

  <MarkupTextarea label="備考" bind:value={data.body} />

  <details
    class="mb-7 rounded-sm border border-neutral-200 bg-white px-3.5 py-2.5"
  >
    <summary class="cursor-pointer text-[12px] font-semibold text-neutral-600">
      詳細設定（税率・最小行数）
    </summary>
    <div class="mt-3 grid gap-3 sm:grid-cols-2">
      <FormField label="消費税率（0.1 = 10%）">
        <FormInput
          type="number"
          step={0.01}
          min={0}
          bind:value={data["tax-rate"]}
        />
      </FormField>
      <FormField label="項目の最小行数">
        <FormInput type="number" min={0} bind:value={data["min-item-rows"]} />
      </FormField>
    </div>
  </details>
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
