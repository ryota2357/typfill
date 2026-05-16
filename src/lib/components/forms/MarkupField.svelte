<script lang="ts">
  import Section from "./Section.svelte";
  import TextArea from "./TextArea.svelte";

  let {
    label,
    value = $bindable(),
    hint,
  }: { label: string; value: string; hint?: string } = $props();
</script>

<Section title={label}>
  <TextArea bind:value mono />
  <p class="font-mono text-[10px] text-neutral-400">
    {hint ??
      'Typst markup 可 · 見出し == / 箇条書き - / 強調 *太字* / リンク #link("https://…")[text] / 行末 \\ で改行'}
  </p>
</Section>
