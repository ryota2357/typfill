<script lang="ts" generics="E extends Record<string, string | number>">
  import { moveItem, type TimelineField } from "./_helpers";

  let {
    label,
    items,
    newEntry,
    fields,
  }: {
    label: string;
    items: E[];
    newEntry: () => E;
    fields: readonly TimelineField<E>[];
  } = $props();

  const gridTemplate = $derived(fields.map((f) => f.width).join(" "));

  function add() {
    items.push(newEntry());
  }
  function remove(i: number) {
    items.splice(i, 1);
  }
  function moveUp(i: number) {
    moveItem(items, i, i - 1);
  }
  function moveDown(i: number) {
    moveItem(items, i, i + 1);
  }
  function setField(entry: E, field: TimelineField<E>, raw: string) {
    const next = field.type === "number" ? Number(raw) : raw;
    (entry as Record<string, string | number>)[field.key] = next;
  }
</script>

<section class="space-y-2">
  <div class="flex items-center justify-between">
    <h2 class="text-lg font-semibold">{label}</h2>
    <button
      type="button"
      onclick={add}
      class="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
    >
      追加
    </button>
  </div>
  {#if items.length === 0}
    <p class="text-sm text-gray-500">（記入なし）</p>
  {:else}
    <ul class="space-y-2">
      {#each items as entry, i (i)}
        <li class="rounded border border-gray-200 p-2">
          <div class="grid gap-2" style:grid-template-columns={gridTemplate}>
            {#each fields as field (field.key)}
              <label>
                <span class="block text-xs text-gray-500">{field.label}</span>
                <input
                  type={field.type}
                  min={field.min}
                  max={field.max}
                  value={entry[field.key]}
                  oninput={(e) =>
                    setField(entry, field, (e.target as HTMLInputElement).value)}
                  class="w-full rounded border border-gray-300 px-2 py-1"
                >
              </label>
            {/each}
          </div>
          <div class="mt-2 flex justify-end gap-1 text-sm">
            <button
              type="button"
              onclick={() => moveUp(i)}
              disabled={i === 0}
              aria-label="上へ"
              class="rounded border border-gray-300 px-2 py-1 disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              onclick={() => moveDown(i)}
              disabled={i === items.length - 1}
              aria-label="下へ"
              class="rounded border border-gray-300 px-2 py-1 disabled:opacity-30"
            >
              ↓
            </button>
            <button
              type="button"
              onclick={() => remove(i)}
              class="rounded border border-red-300 px-2 py-1 text-red-700 hover:bg-red-50"
            >
              削除
            </button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</section>
