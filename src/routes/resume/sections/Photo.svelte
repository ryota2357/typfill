<script lang="ts">
  import { PhotoInput, Section } from "$lib/components/forms";
  import type { Fields } from "$lib/templates/resume";

  // `bind:` because `value` swaps between `null` (not set) and a Photo
  // record — the parent's `data.写真` is replaced wholesale on
  // upload/clear.
  let { value = $bindable() }: { value: Fields["写真"] } = $props();
</script>

<Section title="写真">
  <PhotoInput
    bind:value
    vfsPath="/assets/photo.jpg"
    maxSide={600}
    format={{ type: "image/jpeg", quality: 0.85 }}
    hint="長辺 600px までリサイズし、JPEG（品質 85）として埋め込みます。共有リンクには含まれません。"
  />
</Section>
