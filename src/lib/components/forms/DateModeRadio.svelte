<script lang="ts">
  import DateInput, { type DateRecord } from "./DateInput.svelte";

  // `lastManualDate` is a stash so toggling auto ↔ manual restores the user's
  // previous entry instead of jumping back to today.
  interface Props {
    value: "auto" | DateRecord;
  }
  let { value = $bindable() }: Props = $props();

  function todayDate(): DateRecord {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }

  let lastManualDate = $state<DateRecord>(
    value === "auto" ? todayDate() : { ...value },
  );

  // Keep the stash current whenever `value` holds a concrete date — covers
  // both local DateInput edits and external replacements (import).
  $effect(() => {
    if (value !== "auto") lastManualDate = { ...value };
  });

  const mode = $derived<"auto" | "manual">(
    value === "auto" ? "auto" : "manual",
  );

  function selectAuto() {
    value = "auto";
  }
  function selectManual() {
    value = { ...lastManualDate };
  }
</script>

<div class="flex flex-wrap items-center gap-3 text-[13px]">
  <label class="flex items-center gap-1.5">
    <input type="radio" checked={mode === "auto"} onchange={selectAuto}>
    <span>本日（自動）</span>
  </label>
  <label class="flex items-center gap-1.5">
    <input type="radio" checked={mode === "manual"} onchange={selectManual}>
    <span>指定する</span>
  </label>
  {#if value !== "auto"}
    <DateInput
      bind:value={// biome-ignore lint/complexity/noCommaOperator: Biome doesn't support svelte function bindings syntax
      () => value as DateRecord,
      (v) => value = v}
    />
  {/if}
</div>
