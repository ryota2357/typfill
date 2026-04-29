<script module lang="ts">
  // Column schema for a single editable field in the entry list.
  export type EntryField<E> = {
    key: keyof E & string;
    label: string;
    type: "number" | "text";
    width: string;
    min?: number;
    max?: number;
  };
</script>

<script lang="ts" generics="E extends Record<string, string | number>">
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import Plus from "@lucide/svelte/icons/plus";
  import X from "@lucide/svelte/icons/x";
  import FormInput from "./FormInput.svelte";
  import FormSection from "./FormSection.svelte";

  let {
    label,
    items,
    newEntry,
    fields,
  }: {
    label: string;
    items: E[];
    newEntry: () => E;
    fields: readonly EntryField<E>[];
  } = $props();

  // Column layout: per-field widths + a fixed gutter for the row's
  // delete/move controls so the × button always lines up.
  const gridTemplate = $derived(`${fields.map((f) => f.width).join(" ")} auto`);

  function add() {
    items.push(newEntry());
  }
  function remove(i: number) {
    items.splice(i, 1);
  }
  // Out-of-range target is a no-op so callers can naively pass i±1 without
  // bounds-checking.
  function swap(from: number, to: number) {
    if (to < 0 || to >= items.length) return;
    const [item] = items.splice(from, 1);
    items.splice(to, 0, item);
  }
  function moveUp(i: number) {
    swap(i, i - 1);
  }
  function moveDown(i: number) {
    swap(i, i + 1);
  }
</script>

<FormSection title={label}>
  {#if items.length === 0}
    <p class="text-[12px] text-neutral-400">（記入なし）</p>
  {:else}
    <ul class="flex flex-col gap-2">
      {#each items as entry, i (i)}
        <li
          class="grid items-end gap-2"
          style:grid-template-columns={gridTemplate}
        >
          {#each fields as field (field.key)}
            <label class="flex flex-col gap-1">
              <span class="text-[11px] text-neutral-500">{field.label}</span>
              <FormInput
                type={field.type}
                min={field.min}
                max={field.max}
                bind:value={entry[field.key]}
              />
            </label>
          {/each}
          <div class="flex items-center gap-1">
            <button
              type="button"
              onclick={() => moveUp(i)}
              disabled={i === 0}
              aria-label="上へ"
              class="grid h-7 w-6 cursor-pointer place-items-center rounded-sm border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-30"
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              onclick={() => moveDown(i)}
              disabled={i === items.length - 1}
              aria-label="下へ"
              class="grid h-7 w-6 cursor-pointer place-items-center rounded-sm border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 disabled:opacity-30"
            >
              <ChevronDown size={14} />
            </button>
            <button
              type="button"
              onclick={() => remove(i)}
              aria-label="削除"
              class="grid h-7 w-6 cursor-pointer place-items-center rounded-sm border border-neutral-200 bg-white text-neutral-400 hover:bg-neutral-50 hover:text-red-700"
            >
              <X size={14} />
            </button>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
  <button
    type="button"
    onclick={add}
    class="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-sm border border-dashed border-neutral-300 bg-white px-3 py-1.5 text-[12px] text-neutral-500 hover:bg-neutral-50"
  >
    <Plus size={14} />
    行を追加
  </button>
</FormSection>
