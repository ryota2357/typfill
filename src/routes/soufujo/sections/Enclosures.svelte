<script lang="ts">
  import { type EntryField, EntryList } from "$lib/components/forms";
  import type { Enclosure } from "$lib/templates/soufujo";

  interface Props {
    items: Enclosure[];
  }
  let { items }: Props = $props();

  const FIELDS: readonly EntryField<Enclosure>[] = [
    { key: "名前", label: "品名", type: "text", width: "1fr" },
    { key: "数量", label: "数量", type: "text", width: "6em" },
  ];

  function newEnclosure(): Enclosure {
    return { 名前: "", 数量: "" };
  }
</script>

<EntryList label="同封物" {items} newEntry={newEnclosure} fields={FIELDS} />
