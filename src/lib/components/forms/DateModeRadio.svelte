<script lang="ts">
  import type { DateRecord } from "./DateInput.svelte";

  // Bridges the data model `"auto" | DateRecord` to a two-radio UX. The local
  // `manualDate` preserves the last-edited date across auto/manual toggles so
  // the user doesn't lose input when switching back. It seeds from the
  // initial `value` once at instantiation; later external replacements of
  // `value` (e.g. import) only re-seed via parent-controlled remount.
  let { value = $bindable() }: { value: "auto" | DateRecord } = $props();

  function todayDate(): DateRecord {
    const d = new Date();
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  }

  let manualDate = $state<DateRecord>(
    value === "auto" ? todayDate() : { ...value },
  );
  const mode = $derived<"auto" | "manual">(
    value === "auto" ? "auto" : "manual",
  );

  // Re-seed manualDate when `value` is replaced externally (e.g. parent
  // imports a new record). We only sync when `value` is a manual date that
  // differs from `manualDate` — user edits already keep the two in sync, so
  // this is a no-op for normal typing.
  $effect(() => {
    if (value === "auto") return;
    const eq =
      value.year === manualDate.year &&
      value.month === manualDate.month &&
      value.day === manualDate.day;
    if (!eq) manualDate = { ...value };
  });

  const pad = (n: number) => String(n).padStart(2, "0");
  const manualIso = $derived(
    `${manualDate.year}-${pad(manualDate.month)}-${pad(manualDate.day)}`,
  );

  function selectAuto() {
    value = "auto";
  }
  function selectManual() {
    value = { ...manualDate };
  }
  function onManualDateInput(e: Event) {
    const raw = (e.target as HTMLInputElement).value;
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return;
    const next = {
      year: Number(m[1]),
      month: Number(m[2]),
      day: Number(m[3]),
    };
    manualDate = next;
    value = { ...next };
  }
</script>

<div class="flex flex-wrap items-center gap-3">
  <label class="flex items-center gap-1">
    <input type="radio" checked={mode === "auto"} onchange={selectAuto}>
    <span>本日（自動）</span>
  </label>
  <label class="flex items-center gap-1">
    <input type="radio" checked={mode === "manual"} onchange={selectManual}>
    <span>指定する</span>
  </label>
  {#if mode === "manual"}
    <input
      type="date"
      value={manualIso}
      oninput={onManualDateInput}
      class="rounded border border-gray-300 px-2 py-1"
    >
  {/if}
</div>
