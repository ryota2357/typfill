<script lang="ts">
  import type { EntryField } from "$lib/components/forms";
  import { EntryList } from "$lib/components/forms";
  import type { TimelineEntry } from "$lib/templates/resume";

  const TIMELINE_FIELDS: readonly EntryField<TimelineEntry>[] = [
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

  function newTimelineEntry(): TimelineEntry {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, content: "" };
  }

  let { label, items }: { label: string; items: TimelineEntry[] } = $props();
</script>

<EntryList
  {label}
  {items}
  newEntry={newTimelineEntry}
  fields={TIMELINE_FIELDS}
/>
