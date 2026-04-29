<script module lang="ts">
  export type DateRecord = { year: number; month: number; day: number };
</script>

<script lang="ts">
  // Native <input type="date"> bridge for DateRecord. Uses the same
  // `form-input` utility as FormInput (defined in layout.css) so the two
  // controls match without sharing a Svelte component — bind:value can't
  // round-trip a DateRecord through the input's iso string, so this stays
  // controlled.
  let { value = $bindable() }: { value: DateRecord } = $props();

  const pad = (n: number) => String(n).padStart(2, "0");
  const iso = $derived(`${value.year}-${pad(value.month)}-${pad(value.day)}`);

  function onChange(e: Event) {
    const raw = (e.target as HTMLInputElement).value;
    const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return;
    value = { year: Number(m[1]), month: Number(m[2]), day: Number(m[3]) };
  }
</script>

<input type="date" value={iso} oninput={onChange} class="form-input">
