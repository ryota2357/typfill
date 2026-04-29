<script lang="ts">
  import FormSection from "./FormSection.svelte";
  import FormTextArea from "./FormTextArea.svelte";

  // High-level convenience wrapper: section heading + monospace textarea +
  // Typst markup hint. Used for free-text fields (志望動機, 備考) where
  // share-URL imports compile their content as Typst markup.
  let {
    label,
    value = $bindable(),
    hint,
  }: { label: string; value: string; hint?: string } = $props();
</script>

<FormSection title={label}>
  <FormTextArea bind:value mono />
  <p class="font-mono text-[10px] text-neutral-400">
    {hint ??
      'Typst markup 可 · 見出し == / 箇条書き - / 強調 *太字* / リンク #link("https://…")[text] / 行末 \\ で改行'}
  </p>
</FormSection>
