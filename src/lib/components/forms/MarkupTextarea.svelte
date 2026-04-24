<script lang="ts">
  let {
    label,
    value = $bindable(),
    hint,
  }: { label: string; value: string; hint?: string } = $props();
</script>

<section class="space-y-2">
  <h2 class="text-lg font-semibold">{label}</h2>
  <textarea
    bind:value
    rows="5"
    class="w-full rounded border border-gray-300 px-2 py-1 font-mono text-sm"
  ></textarea>
  <p class="text-xs text-gray-500">
    {hint ??
      "Typst 記法が使えます: 見出し == / 箇条書き - / 強調 *太字* / リンク #link(\"https://…\")[text] / 行末 \\ で改行。共有リンクから取り込んだ内容は記載どおりにコンパイルされます。"}
  </p>
</section>
