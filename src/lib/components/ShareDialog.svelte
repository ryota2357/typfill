<script lang="ts" generics="T">
  import X from "@lucide/svelte/icons/x";
  import { buildShareUrl } from "$lib/templates/url";
  import Button from "./Button.svelte";
  import Dialog from "./Dialog.svelte";

  // Generic share dialog. The template ref carries the bare minimum needed to
  // produce a share URL — `templateId` for the fragment label and `serialize`
  // for the payload (which already applies `sanitizeForShare` internally when
  // called with `{ for: "share" }`).
  let {
    data,
    template,
    onclose,
    extraNotice,
  }: {
    data: T;
    template: {
      templateId: string;
      serialize: (data: T, options?: { for?: "share" | "storage" }) => string;
    };
    onclose: () => void;
    extraNotice?: import("svelte").Snippet;
  } = $props();

  let copyStatus = $state<"idle" | "copied" | "error">("idle");

  // Browsers tolerate very long fragments (32k+), but the UI warns past
  // ~8000 chars since clipboard apps, chat clients, and QR codes often
  // truncate before that.
  const payload = $derived(template.serialize(data, { for: "share" }));
  const fragmentChars = $derived(payload.length);
  const shareUrl = $derived(
    typeof location === "undefined"
      ? ""
      : buildShareUrl({ templateId: template.templateId, payload }),
  );
  const sizeWarning = $derived(fragmentChars > 8000);

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      copyStatus = "copied";
      setTimeout(() => (copyStatus = "idle"), 2000);
    } catch {
      copyStatus = "error";
    }
  }
</script>

<Dialog title="共有リンクを作成" {onclose} size="lg">
  {#snippet titleActions()}
    <Button variant="ghost" size="icon" onclick={onclose} aria-label="閉じる">
      <X size={16} />
    </Button>
  {/snippet}

  <p class="text-[13px] text-neutral-700">
    URL のフラグメント（<code class="font-mono text-[12px]"
      >#…</code
    >）に圧縮して埋め込みます。個人情報はサーバーに送信されません。
  </p>

  {#if extraNotice}
    {@render extraNotice()}
  {/if}

  <div class="flex flex-col gap-1">
    <div
      class="flex items-baseline justify-between text-[11px] text-neutral-500"
    >
      <span>リンクプレビュー</span>
      <span class="tabular-nums">
        約 {fragmentChars.toLocaleString()} 文字
        {#if sizeWarning}
          <span class="ml-1 text-orange-700">⚠ 長すぎる可能性があります</span>
        {/if}
      </span>
    </div>
    <textarea
      readonly
      value={shareUrl}
      class="h-20 w-full resize-none rounded-sm border border-neutral-200 bg-white p-2 font-mono text-[11px] break-all"
    ></textarea>
  </div>

  <div class="flex items-center justify-end gap-2">
    {#if copyStatus === "copied"}
      <span class="text-[12px] text-emerald-700">✓ コピーしました</span>
    {:else if copyStatus === "error"}
      <span class="text-[12px] text-red-700">コピーに失敗しました</span>
    {/if}
    <Button variant="primary" size="md" onclick={copy}>
      クリップボードにコピー
    </Button>
  </div>
</Dialog>
