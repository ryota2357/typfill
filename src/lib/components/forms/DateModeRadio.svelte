<script lang="ts">
  import DateInput, { type DateRecord } from "./DateInput.svelte";

  // Bridges the data model `"auto" | DateRecord` to a two-radio UX. The local
  // `manualDate` preserves the last-edited date across auto/manual toggles so
  // the user doesn't lose input when switching back. It seeds from the
  // initial `value` once at instantiation; later external replacements of
  // `value` (e.g. import) re-seed via the read-back effect below.
  let { value = $bindable() }: { value: "auto" | DateRecord } = $props();

  function todayDate(): DateRecord {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }
  function eqDate(a: DateRecord, b: DateRecord): boolean {
    return a.year === b.year && a.month === b.month && a.day === b.day;
  }

  let manualDate = $state<DateRecord>(
    value === "auto" ? todayDate() : { ...value },
  );
  const mode = $derived<"auto" | "manual">(
    value === "auto" ? "auto" : "manual",
  );

  // Pull external manual changes (import etc) into local state so the
  // child DateInput's bind:value sees them.
  $effect(() => {
    if (value === "auto") return;
    if (!eqDate(value, manualDate)) manualDate = { ...value };
  });

  // Mirror local edits back to parent. Equality guard prevents an effect
  // loop with the read-back above.
  $effect(() => {
    if (mode !== "manual" || value === "auto") return;
    if (!eqDate(value, manualDate)) value = { ...manualDate };
  });

  function selectAuto() {
    value = "auto";
  }
  function selectManual() {
    value = { ...manualDate };
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
  {#if mode === "manual"}
    <!-- form-input itself has no width; the child input sizes to its
         content here, which is what we want for inline placement. -->
    <DateInput bind:value={manualDate} />
  {/if}
</div>
