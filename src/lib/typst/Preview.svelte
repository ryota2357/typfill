<script lang="ts" module>
	import type { TypstAssets, TypstDiagnostic, TypstSources } from './protocol';

	export type CompileInputs = {
		sources: TypstSources;
		mainPath: string;
		assets?: TypstAssets;
	};
</script>

<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { TypstClient } from './worker-client';

	let {
		inputs,
		debounceMs = 400,
		downloadName = 'document.pdf'
	}: { inputs: CompileInputs; debounceMs?: number; downloadName?: string } = $props();

	let client = $state<TypstClient | null>(null);
	let svg = $state('');
	let status = $state<'booting' | 'compiling' | 'ready' | 'failed'>('booting');
	let error = $state('');
	let diagnostics = $state<TypstDiagnostic[]>([]);
	let exporting = $state(false);

	let debounceTimer: ReturnType<typeof setTimeout> | null = null;
	let activeAbort: AbortController | null = null;

	onMount(async () => {
		const { createTypstClient } = await import('./worker-client');
		client = createTypstClient();
	});

	onDestroy(() => {
		if (debounceTimer) clearTimeout(debounceTimer);
		activeAbort?.abort();
		client?.dispose();
	});

	$effect(() => {
		// Track the upstream prop identity. The parent feeds this from a $derived
		// that returns a new object whenever any form field changes.
		void inputs;
		if (!client) return;
		if (debounceTimer) clearTimeout(debounceTimer);
		debounceTimer = setTimeout(runCompile, debounceMs);
	});

	async function runCompile() {
		const c = client;
		if (!c) return;
		// Cancel any in-flight compile so its late SVG can't overwrite a newer one.
		activeAbort?.abort();
		const ctl = new AbortController();
		activeAbort = ctl;
		status = 'compiling';
		try {
			const snapshot = inputs;
			const res = await c.compile(snapshot.sources, snapshot.mainPath, {
				assets: snapshot.assets,
				signal: ctl.signal
			});
			svg = res.svg;
			diagnostics = res.diagnostics;
			error = '';
			status = 'ready';
		} catch (e) {
			if ((e as { name?: string }).name === 'AbortError') return;
			diagnostics = [];
			error = e instanceof Error ? e.message : String(e);
			status = 'failed';
		}
	}

	async function downloadPdf() {
		const c = client;
		if (!c) return;
		exporting = true;
		error = '';
		try {
			const res = await c.exportPdf(inputs.sources, inputs.mainPath, {
				assets: inputs.assets
			});
			const blob = new Blob([res.pdf as BlobPart], { type: 'application/pdf' });
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = downloadName;
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			exporting = false;
		}
	}
</script>

<div class="flex h-full flex-col gap-2">
	<div class="flex items-center justify-between gap-2 text-sm">
		<span class="text-gray-500">プレビュー: {status}</span>
		<button
			type="button"
			onclick={downloadPdf}
			disabled={!client || status === 'booting' || exporting}
			class="rounded bg-green-600 px-3 py-1 text-white hover:bg-green-700 disabled:opacity-50"
		>
			{exporting ? 'PDF 生成中…' : 'PDF をダウンロード'}
		</button>
	</div>

	{#if error}
		<pre class="whitespace-pre-wrap rounded bg-red-50 p-2 text-xs text-red-800">{error}</pre>
	{/if}

	{#if diagnostics.length > 0}
		<ul class="rounded bg-yellow-50 p-2 text-xs text-yellow-900">
			{#each diagnostics as d, i (i)}
				<li><strong>{d.severity}</strong>: {d.message}</li>
			{/each}
		</ul>
	{/if}

	<div class="preview min-h-[600px] flex-1 overflow-auto rounded border border-gray-200 bg-white">
		{#if status === 'booting'}
			<p class="p-4 text-gray-500">ワーカーを起動中…</p>
		{:else if svg}
			<!-- typst.ts emits trusted SVG from sources we generated; safe to inline. -->
			{@html svg}
		{:else if status === 'compiling'}
			<p class="p-4 text-gray-500">コンパイル中…</p>
		{/if}
	</div>
</div>

<style>
	.preview :global(svg) {
		display: block;
		max-width: 100%;
		height: auto;
		margin: 0 auto;
	}
</style>
