<script lang="ts">
  import { PhotoInput, Section } from "$lib/components/forms";
  import type { Photo } from "$lib/templates/resume";

  interface Props {
    value: Photo | null;
  }
  let { value = $bindable() }: Props = $props();
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
