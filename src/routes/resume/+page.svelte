<script lang="ts">
  import {
    type EntryField,
    EntryList,
    MarkupField,
  } from "$lib/components/forms";
  import ImportDialog, {
    type PreviewItem,
  } from "$lib/components/ImportDialog.svelte";
  import TemplateEditor from "$lib/components/TemplateEditor.svelte";
  import * as template from "$lib/templates/resume";
  import { createTemplateState } from "$lib/templates/state.svelte";
  import { buildResumeFilename } from "./filename";
  import Address from "./sections/Address.svelte";
  import Advanced from "./sections/Advanced.svelte";
  import DocumentDate from "./sections/DocumentDate.svelte";
  import PersonalInfo from "./sections/PersonalInfo.svelte";
  import Photo from "./sections/Photo.svelte";

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

  function newTimelineEntry(): template.TimelineEntry {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, content: "" };
  }

  const state = createTemplateState(template, () =>
    structuredClone(template.EMPTY_FIELDS),
  );

  const filename = $derived(buildResumeFilename(state.data));

  function truncate(s: string, max: number): string {
    return s.length > max ? `${s.slice(0, max)}…` : s;
  }

  // Compact 住所 preview. Postal + first 30 chars of address — enough for the
  // user to recognize the record without exposing full PII in a confirmation
  // modal.
  function addressPreview(c: template.Contact): string {
    const postal = c.郵便番号.trim();
    const addr = c.住所.trim();
    if (!postal && !addr) return "（未設定）";
    const postalPart = postal ? `〒${postal}` : "";
    const addrPart = addr ? truncate(addr, 30) : "";
    return [postalPart, addrPart].filter(Boolean).join(" ");
  }

  function formatDate(d: { year: number; month: number; day: number }): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.year}-${pad(d.month)}-${pad(d.day)}`;
  }

  const previewItems = $derived<readonly PreviewItem[]>(
    state.importPayload === null
      ? []
      : (() => {
          const p = state.importPayload;
          const fullName = (p.氏名.姓 + p.氏名.名).trim() || "（未設定）";
          return [
            { label: "氏名", value: fullName, format: "break-all" },
            {
              label: "生年月日",
              value: formatDate(p.生年月日),
              format: "tabular",
            },
            {
              label: "現住所",
              value: addressPreview(p.現住所),
              format: "break-all",
            },
            {
              label: "連絡先",
              value: addressPreview(p.連絡先),
              format: "break-all",
            },
            { label: "学歴", value: `${p.学歴.length} 件` },
            { label: "職歴", value: `${p.職歴.length} 件` },
            { label: "免許・資格", value: `${p["免許・資格"].length} 件` },
            { label: "志望動機", value: `${p.志望動機.length} 文字` },
            {
              label: "本人希望記入欄",
              value: `${p.本人希望記入欄.length} 文字`,
            },
            { label: "写真", value: p.写真 ? "あり" : "なし" },
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
  shareExtraNotice={photoNotice}
>
  <PersonalInfo data={state.data} />
  <DocumentDate bind:value={state.data.日付} />
  <Photo bind:value={state.data.写真} />
  <Address label="現住所" value={state.data.現住所} />
  <Address label="連絡先（現住所と異なる場合のみ）" value={state.data.連絡先} />
  <EntryList
    label="学歴"
    items={state.data.学歴}
    newEntry={newTimelineEntry}
    fields={TIMELINE_FIELDS}
  />
  <EntryList
    label="職歴"
    items={state.data.職歴}
    newEntry={newTimelineEntry}
    fields={TIMELINE_FIELDS}
  />
  <EntryList
    label="免許・資格"
    items={state.data["免許・資格"]}
    newEntry={newTimelineEntry}
    fields={TIMELINE_FIELDS}
  />
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
