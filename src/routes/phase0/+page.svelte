<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import libTyp from '$lib/templates/resume/template/lib.typ?raw';
	import mainTyp from '$lib/templates/resume/template/main.typ?raw';
	import type { TypstClient } from '$lib/typst/worker-client';

	const sources = {
		'/main.typ': mainTyp,
		'/lib.typ': libTyp
	};

	let client = $state<TypstClient | undefined>(undefined);
	let svg = $state('');
	let error = $state('');
	let status = $state<'booting' | 'compiling' | 'ready' | 'failed'>('booting');
	let exportingPdf = $state(false);

	onMount(async () => {
		const { createTypstClient } = await import('$lib/typst/worker-client');
		client = createTypstClient();
		await runCompile();
	});

	onDestroy(() => client?.dispose());

	async function runCompile() {
		if (!client) return;
		status = 'compiling';
		error = '';
		try {
			const res = await client.compile(sources, '/main.typ');
			svg = res.svg;
			status = 'ready';
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			status = 'failed';
		}
	}

	async function downloadPdf() {
		if (!client) return;
		exportingPdf = true;
		error = '';
		try {
			const res = await client.exportPdf(sources, '/main.typ');
			const blob = new Blob([res.pdf as BlobPart], { type: 'application/pdf' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = 'phase0-resume.pdf';
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			exportingPdf = false;
		}
	}
</script>

<svelte:head><title>Phase 0 spike - pdf-by-typst</title></svelte:head>

<main class="mx-auto max-w-5xl p-6 space-y-4">
	<header class="flex items-baseline justify-between gap-4">
		<h1 class="text-2xl font-bold">Phase 0: feasibility spike</h1>
		<span class="text-sm text-gray-500">status: {status}</span>
	</header>

	<p class="text-sm text-gray-600">
		Hard-coded resume <code>main.typ</code> → Web Worker → typst.ts compile → SVG preview / PDF
		download. No user input yet.
	</p>

	<div class="flex gap-2">
		<button
			class="rounded bg-blue-600 px-3 py-1 text-white disabled:opacity-50"
			onclick={runCompile}
			disabled={!client || status === 'compiling'}
		>
			Recompile
		</button>
		<button
			class="rounded bg-green-600 px-3 py-1 text-white disabled:opacity-50"
			onclick={downloadPdf}
			disabled={!client || status !== 'ready' || exportingPdf}
		>
			{exportingPdf ? 'Exporting…' : 'Download PDF'}
		</button>
	</div>

	{#if error}
		<pre class="whitespace-pre-wrap rounded bg-red-50 p-3 text-sm text-red-800">{error}</pre>
	{/if}

	<section class="rounded border border-gray-200 bg-gray-50 p-4">
		<h2 class="mb-2 text-sm font-semibold text-gray-500">SVG preview</h2>
		{#if status === 'compiling' || status === 'booting'}
			<p class="text-gray-500">Working…</p>
		{:else if svg}
			<div class="preview overflow-auto bg-white">
				<!-- Hard-coded spike content only; no user input is injected into this SVG. -->
				{@html svg}
			</div>
		{/if}
	</section>
</main>

<style>
	.preview :global(svg) {
		display: block;
		max-width: 100%;
		height: auto;
	}
</style>
