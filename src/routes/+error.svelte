<script lang="ts">
  import { page } from "$app/state";
  import GithubMark from "$lib/components/GithubMark.svelte";
  import { listTemplates } from "$lib/templates/registry";

  const enabledTemplates = listTemplates().filter((t) => t.enabled);
  const status = $derived(page.status);
  const pathname = $derived(page.url.pathname);
  const title = $derived(
    status === 404
      ? "ページが見つかりませんでした"
      : `エラーが発生しました（${status}）`,
  );
  const description = $derived(
    status === 404
      ? "URL が間違っているか、このページは削除された可能性があります。下のテンプレートから始められます。"
      : (page.error?.message ?? "不明なエラーが発生しました"),
  );
  const errorHint = $derived(
    status === 404
      ? "このページは存在しません"
      : "詳細はコンソールを確認してください",
  );
</script>

<svelte:head><title>{status} · Typfill</title></svelte:head>

<div class="flex min-h-[100dvh] flex-col">
  <header
    class="flex flex-shrink-0 items-center justify-between border-b border-divider px-8 py-4 font-mono text-[12px]"
  >
    <a
      href="/"
      class="text-[14px] font-semibold text-neutral-900 no-underline"
      style="font-family: inherit;"
    >
      Typfill
    </a>
    <span class="text-neutral-400 tabular-nums">{status}</span>
  </header>

  <main class="flex flex-1 items-center justify-center px-8 py-12">
    <div class="w-full max-w-[520px]">
      <!-- Typst-flavored compile error. The route's pathname becomes the
           argument to a fictional `not-found` function so the error reads
           like a real Typst diagnostic. -->
      <div
        class="mb-8 overflow-hidden rounded-sm border border-neutral-200 font-mono text-[12px] text-neutral-500"
      >
        <div
          class="flex items-center justify-between border-b border-divider bg-neutral-50 px-3.5 py-2 text-[11px] text-neutral-400"
        >
          <span>main.typ</span>
          <span>compile error</span>
        </div>
        <div class="px-4 py-3.5 text-neutral-700">
          <div>
            <span class="text-neutral-400">1 │ </span>
            <span class="text-purple-500">#</span>
            <span>not-found</span>
            <span class="text-neutral-400">(</span>
            <span class="text-green-600">"{pathname}"</span>
            <span class="text-neutral-400">)</span>
          </div>
          <div class="mt-1.5">
            <span class="text-neutral-400"> │ </span>
            <span class="text-red-600">^^^^^^^^^^^</span>
          </div>
          <div class="mt-1.5 text-red-600">
            <span class="text-neutral-400">error: </span>
            unknown function `not-found`
          </div>
          <div class="mt-1 pl-4 text-neutral-400">hint: {errorHint}</div>
        </div>
      </div>

      <h1 class="mb-2 text-[22px] font-bold tracking-[-0.3px]">{title}</h1>
      <p class="mb-8 text-pretty text-neutral-600">{description}</p>

      <ul class="flex flex-col gap-2">
        <li>
          <a
            href="/"
            class="flex items-baseline justify-between rounded-sm border border-neutral-200 px-3.5 py-3 text-inherit no-underline hover:bg-neutral-50"
          >
            <span class="flex items-baseline gap-2">
              <span class="text-[14px] font-semibold">トップページへ</span>
              <span class="font-mono text-[11px] text-neutral-400">Home</span>
            </span>
            <span class="text-neutral-400">→</span>
          </a>
        </li>
        {#each enabledTemplates as t (t.templateId)}
          <li>
            <a
              href={t.href}
              class="flex items-baseline justify-between rounded-sm border border-neutral-200 px-3.5 py-3 text-inherit no-underline hover:bg-neutral-50"
            >
              <span class="flex items-baseline gap-2">
                <span class="text-[14px] font-semibold">{t.label}を作る</span>
                <span class="font-mono text-[11px] text-neutral-400"
                  >{t.sub}</span
                >
              </span>
              <span class="text-neutral-400">→</span>
            </a>
          </li>
        {/each}
      </ul>
    </div>
  </main>

  <footer
    class="flex flex-shrink-0 items-center justify-between border-t border-divider px-8 py-4 font-mono text-[11px] text-neutral-400"
  >
    <span>HTTP {status} · {status === 404 ? "Not Found" : "Error"}</span>
    <a
      href="https://github.com/ryota2357/typfill"
      target="_blank"
      rel="noreferrer"
      class="inline-flex items-center gap-1.5 text-neutral-600 hover:underline"
    >
      <GithubMark size={11} />
      ryota2357/typfill
    </a>
  </footer>
</div>
