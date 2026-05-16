<script lang="ts">
  import { type EntryField, EntryList } from "$lib/components/forms";
  import type { InvoiceItem } from "$lib/templates/invoice";

  interface Props {
    items: InvoiceItem[];
  }
  let { items }: Props = $props();

  const ITEM_FIELDS: readonly EntryField<InvoiceItem>[] = [
    { key: "name", label: "品目", type: "text", width: "1fr" },
    { key: "amount", label: "数量", type: "number", width: "6em", min: 0 },
    { key: "unit", label: "単位", type: "text", width: "6em" },
    { key: "price", label: "単価", type: "number", width: "8em", min: 0 },
  ];

  function newInvoiceItem(): InvoiceItem {
    return { name: "", amount: 1, unit: "", price: 0 };
  }
</script>

<EntryList
  label="項目"
  {items}
  newEntry={newInvoiceItem}
  fields={ITEM_FIELDS}
/>
