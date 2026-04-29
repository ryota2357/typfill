<script lang="ts">
  // Monospace status pill: small colored dot + label. Used by both the
  // autosave indicator (TemplateEditor) and the compile status row
  // (Preview). The shared visual language is the point of this component
  // — when both indicators sit in the same chrome, a viewer can tell at
  // a glance which lifecycle just changed.
  let {
    tone,
    label,
  }: {
    tone: "neutral" | "busy" | "ok" | "error";
    label: string;
  } = $props();

  const DOT_TONE = {
    neutral: "bg-neutral-400",
    // `busy` shares the neutral hue but pulses, so the user reads the
    // motion ("something is happening") before the color.
    busy: "bg-neutral-400 animate-pulse",
    ok: "bg-emerald-500",
    error: "bg-red-500",
  } as const;
</script>

<span class="flex items-center gap-1.5 font-mono text-[11px] text-neutral-500">
  <span class={["h-1.5 w-1.5 rounded-full", DOT_TONE[tone]]}></span>
  {label}
</span>
