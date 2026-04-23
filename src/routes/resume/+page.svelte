<script lang="ts">
  import {
    type EntryField,
    EntryListForm,
    MarkupTextarea,
  } from "$lib/components/forms";
  import TemplateEditor from "$lib/components/TemplateEditor.svelte";
  import * as template from "$lib/templates/resume";
  import AddressForm from "./AddressForm.svelte";
  import AdvancedParamsForm from "./AdvancedParamsForm.svelte";
  import DocumentDateForm from "./DocumentDateForm.svelte";
  import { buildResumeFilename } from "./filename";
  import ImportDialog from "./ImportDialog.svelte";
  import PersonalInfoForm from "./PersonalInfoForm.svelte";
  import PhotoUploadForm from "./PhotoUploadForm.svelte";

  const TIMELINE_FIELDS: readonly EntryField<template.TimelineEntry>[] = [
    { key: "year", label: "年", type: "number", width: "5em" },
    {
      key: "month",
      label: "月",
      type: "number",
      width: "4em",
      min: 1,
      max: 12,
    },
    { key: "content", label: "内容", type: "text", width: "1fr" },
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

  const filename = $derived(buildResumeFilename(data));

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
  shareExtraNotice={photoNotice}
>
  <div class="space-y-6">
    <PersonalInfoForm {data} />
    <DocumentDateForm bind:value={data.日付} />
    <PhotoUploadForm bind:value={data.写真} />
    <AddressForm label="現住所" value={data.現住所} />
    <AddressForm label="連絡先（現住所と異なる場合のみ）" value={data.連絡先} />
    <EntryListForm
      label="学歴"
      items={data.学歴}
      newEntry={template.newTimelineEntry}
      fields={TIMELINE_FIELDS}
    />
    <EntryListForm
      label="職歴"
      items={data.職歴}
      newEntry={template.newTimelineEntry}
      fields={TIMELINE_FIELDS}
    />
    <EntryListForm
      label="免許・資格"
      items={data["免許・資格"]}
      newEntry={template.newTimelineEntry}
      fields={TIMELINE_FIELDS}
    />
    <MarkupTextarea label="志望動機" bind:value={data.志望動機} />
    <MarkupTextarea label="本人希望記入欄" bind:value={data.本人希望記入欄} />
    <details class="rounded border border-gray-200 p-3">
      <summary class="cursor-pointer text-sm font-semibold text-gray-700">
        詳細設定（レイアウト調整）
      </summary>
      <div class="mt-3"><AdvancedParamsForm params={data.params} /></div>
    </details>
  </div>
</TemplateEditor>

{#snippet photoNotice()}
  {#if data.写真 !== null}
    <p
      class="rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600"
    >
      共有リンクには写真は含まれません。
    </p>
  {/if}
{/snippet}

{#if importPayload}
  <ImportDialog
    imported={importPayload}
    hasExisting={typeof localStorage !== "undefined" &&
      localStorage.getItem(template.storageKey) !== null}
    onaccept={onImportAccept}
    oncancel={onImportCancel}
  />
{/if}
