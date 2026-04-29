<script lang="ts">
  import GithubMark from "$lib/components/GithubMark.svelte";
  import { listTemplates } from "$lib/templates/registry";

  const templates = listTemplates();
</script>

<svelte:head><title>Typfill</title></svelte:head>

<main class="mx-auto max-w-[560px] px-6 pt-16 pb-24">
  <header class="mb-14">
    <h1 class="mb-3 text-[28px] font-bold tracking-[-0.4px]">Typfill</h1>
    <p class="text-[15px] text-pretty text-neutral-600">
      ブラウザだけで Typst テンプレートから PDF を生成します。
      フォームを埋めるだけで、印刷可能な書類を作れます。
    </p>
  </header>

  <section class="mb-14">
    <h2
      class="mb-4 text-[11px] font-semibold tracking-[1px] text-neutral-500 uppercase"
    >
      Templates
    </h2>
    <ul class="flex flex-col gap-2">
      {#each templates as t (t.templateId)}
        {#if t.enabled}
          <li>
            <a
              href={t.href}
              class="block rounded-sm border border-neutral-200 bg-white px-4 py-3.5 hover:bg-neutral-50"
            >
              <div class="mb-1.5 flex items-baseline justify-between gap-3">
                <div class="flex items-baseline gap-2">
                  <span class="text-[15px] font-semibold">{t.label}</span>
                  <span class="font-mono text-[11px] text-neutral-400"
                    >{t.sub}</span
                  >
                </div>
                <span class="text-[13px] text-neutral-400">→</span>
              </div>
              <span
                class="inline-flex items-center gap-1.5 font-mono text-[11px] text-neutral-500"
              >
                <GithubMark size={12} />
                <span>{t.repo}</span>
              </span>
            </a>
          </li>
        {:else}
          <li
            class="cursor-not-allowed rounded-sm border border-dashed border-neutral-200 px-4 py-3.5 text-neutral-400"
          >
            <div class="flex items-baseline gap-2">
              <span class="text-[15px]">{t.label}</span>
              <span class="font-mono text-[11px]">{t.sub}</span>
              <span class="ml-auto text-[12px]">準備中</span>
            </div>
          </li>
        {/if}
      {/each}
    </ul>
  </section>

  <section class="mb-14">
    <h2
      class="mb-4 text-[11px] font-semibold tracking-[1px] text-neutral-500 uppercase"
    >
      How it works
    </h2>
    <p class="mb-3.5 text-pretty text-neutral-700">
      Typfill には API もデータベースもありません。フォームに入力した内容は
      <code class="font-mono text-[12.5px]">localStorage</code>
      に保存され、Typst のコンパイルは
      <code class="font-mono text-[12.5px]">typst.ts</code>
      の WebAssembly ビルドが Web Worker 内で実行します。生成された PDF
      はそのままブラウザでダウンロードされ、サーバーには一切送信されません。
    </p>
    <p class="text-pretty text-neutral-700">
      共有リンクは URL の fragment（<code class="font-mono text-[12.5px]"
        >#...</code
      >）にデータを埋め込む方式なので、リンク自体もネットワークを経由しません。ホスティングは
      Cloudflare Pages
      で静的ファイル配信のみ、サーバーランタイムは存在しません。
    </p>
  </section>

  <footer
    class="flex items-center justify-between border-t border-divider pt-6 font-mono text-[12px] text-neutral-400"
  >
    <span>MIT License</span>
    <a
      href="https://github.com/ryota2357/typfill"
      target="_blank"
      rel="noreferrer"
      class="inline-flex items-center gap-1.5 text-neutral-600 hover:underline"
    >
      <GithubMark size={13} />
      ryota2357/typfill
    </a>
  </footer>
</main>
