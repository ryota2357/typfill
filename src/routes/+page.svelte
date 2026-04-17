<script lang="ts">
	import { listTemplates } from '$lib/templates/registry';

	const templates = listTemplates();
</script>

<svelte:head><title>pdf-by-typst</title></svelte:head>

<main class="mx-auto max-w-md space-y-4 p-6">
	<h1 class="text-2xl font-bold">pdf-by-typst</h1>
	<p class="text-sm text-gray-600">ブラウザだけで Typst テンプレートから PDF を生成します。</p>
	<ul class="space-y-2">
		{#each templates as t (t.id)}
			{#if t.enabled}
				<li>
					<a href={`/${t.id}`} class="block rounded border border-gray-300 p-3 hover:bg-gray-50">
						{t.label} を作る →
					</a>
				</li>
			{:else}
				<li
					class="block cursor-not-allowed rounded border border-dashed border-gray-300 p-3 text-gray-400"
				>
					{t.label}（準備中）
				</li>
			{/if}
		{/each}
	</ul>
</main>
