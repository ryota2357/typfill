<script lang="ts">
  import type { TimelineField } from "$lib/components/forms/_helpers";
  import DateInput from "$lib/components/forms/DateInput.svelte";
  import DateModeRadio from "$lib/components/forms/DateModeRadio.svelte";
  import MarkupTextarea from "$lib/components/forms/MarkupTextarea.svelte";
  import PartyForm from "$lib/components/forms/PartyForm.svelte";
  import TimelineForm from "$lib/components/forms/TimelineForm.svelte";
  import TemplateEditor from "$lib/components/TemplateEditor.svelte";
  import * as template from "$lib/templates/invoice";
  import { buildInvoiceFilename } from "./filename";
  import ImportDialog from "./ImportDialog.svelte";

  const ITEM_FIELDS: readonly TimelineField<template.InvoiceItem>[] = [
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
  <div class="space-y-6">
    <section class="space-y-3">
      <h2 class="text-lg font-semibold">基本情報</h2>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="block sm:col-span-2">
          <span class="text-sm text-gray-700">タイトル</span>
          <input
            type="text"
            bind:value={data.title}
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          >
        </label>
        <label class="block">
          <span class="text-sm text-gray-700">請求書番号（連番）</span>
          <input
            type="number"
            min="1"
            bind:value={data["invoice-number-series"]}
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          >
        </label>
        <label class="block">
          <span class="text-sm text-gray-700">支払期限</span>
          <DateInput
            bind:value={data["due-date"]}
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          />
        </label>
      </div>
      <fieldset class="space-y-2">
        <legend class="text-sm text-gray-700">発行日</legend>
        <DateModeRadio bind:value={data.date} />
      </fieldset>
    </section>

    <PartyForm label="請求先" value={data.recipient} />
    <PartyForm label="請求元" value={data.issuer} />

    <section class="space-y-2">
      <h2 class="text-lg font-semibold">振込先</h2>
      <div class="grid gap-2 sm:grid-cols-2">
        <label class="block sm:col-span-2">
          <span class="text-sm text-gray-700">銀行名</span>
          <input
            type="text"
            bind:value={data.account.bank}
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          >
        </label>
        <label class="block">
          <span class="text-sm text-gray-700">支店名</span>
          <input
            type="text"
            bind:value={data.account.branch}
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          >
        </label>
        <label class="block">
          <span class="text-sm text-gray-700">口座種別</span>
          <input
            type="text"
            bind:value={data.account.type}
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          >
        </label>
        <label class="block">
          <span class="text-sm text-gray-700">口座番号</span>
          <input
            type="text"
            bind:value={data.account.number}
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          >
        </label>
        <label class="block">
          <span class="text-sm text-gray-700">口座名義</span>
          <input
            type="text"
            bind:value={data.account.holder}
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          >
        </label>
      </div>
    </section>

    <TimelineForm
      label="項目"
      items={data.items}
      newEntry={template.newInvoiceItem}
      fields={ITEM_FIELDS}
    />

    <MarkupTextarea label="備考" bind:value={data.body} />

    <details class="rounded border border-gray-200 p-3">
      <summary class="cursor-pointer text-sm font-semibold text-gray-700">
        詳細設定（税率・最小行数）
      </summary>
      <div class="mt-3 grid gap-2 sm:grid-cols-2">
        <label class="block">
          <span class="text-sm text-gray-700">消費税率（0.1 = 10%）</span>
          <input
            type="number"
            step="0.01"
            min="0"
            bind:value={data["tax-rate"]}
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          >
        </label>
        <label class="block">
          <span class="text-sm text-gray-700">項目の最小行数</span>
          <input
            type="number"
            min="0"
            bind:value={data["min-item-rows"]}
            class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
          >
        </label>
      </div>
    </details>
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
