<script lang="ts">
  import type { ResumeParams } from "../types";

  let { params }: { params: ResumeParams } = $props();
</script>

<div class="space-y-3">
  <p class="text-xs text-gray-500">
    テンプレートのレイアウト微調整。長さ単位は <code
      >em / pt / mm / cm / in / %</code
    > が使えます。
  </p>
  <div class="grid gap-3 sm:grid-cols-2">
    <label class="block">
      <span class="text-sm text-gray-700">学歴・職歴の最小行数</span>
      <input
        type="number"
        min="1"
        bind:value={params.学歴・職歴の最小行数}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      />
    </label>
    <label class="block">
      <span class="text-sm text-gray-700">学歴と職歴の間の空行数</span>
      <input
        type="number"
        min="0"
        bind:value={params.学歴と職歴の間の空行数}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      />
    </label>
    <label class="block">
      <span class="text-sm text-gray-700">免許・資格の最小行数</span>
      <input
        type="number"
        min="1"
        bind:value={params.免許・資格の最小行数}
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      />
    </label>
    <label class="block">
      <span class="text-sm text-gray-700">志望動機の高さ</span>
      <input
        type="text"
        bind:value={params.志望動機の高さ}
        placeholder="22em"
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      />
    </label>
    <label class="block">
      <span class="text-sm text-gray-700">本人希望記入欄の高さ</span>
      <input
        type="text"
        bind:value={params.本人希望記入欄の高さ}
        placeholder="10em"
        class="mt-1 w-full rounded border border-gray-300 px-2 py-1"
      />
    </label>
  </div>
</div>
