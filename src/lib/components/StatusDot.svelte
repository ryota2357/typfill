<script lang="ts">
  interface Props {
    tone: "neutral" | "busy" | "ok" | "error";
    label: string;
  }
  let { tone, label }: Props = $props();

  const DOT_TONE = {
    neutral: "bg-neutral-400",
    // `busy` shares the neutral hue but pulses — the user reads the motion
    // before the color.
    busy: "bg-neutral-400 animate-pulse",
    ok: "bg-emerald-500",
    error: "bg-red-500",
  } as const;
</script>

<span class="flex items-center gap-1.5 font-mono text-[11px] text-neutral-500">
  <span class={["h-1.5 w-1.5 rounded-full", DOT_TONE[tone]]}></span>
  {label}
</span>
