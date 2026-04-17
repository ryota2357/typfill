<script lang="ts">
	import { onMount } from 'svelte';
	import { buildResumeFilename } from '$lib/templates/resume/filename';
	import {
		clearResumeStorage,
		hasResumeInStorage,
		loadResumeFromStorage,
		parseResumeJson,
		saveResumeToStorage,
		serializeResumeJson
	} from '$lib/templates/resume/persistence';
	import { ResumeStore } from '$lib/templates/resume/state.svelte';
	import ImportDialog from '$lib/templates/resume/ui/ImportDialog.svelte';
	import ResumeForm from '$lib/templates/resume/ui/ResumeForm.svelte';
	import ShareDialog from '$lib/templates/resume/ui/ShareDialog.svelte';
	import type { ResumeData } from '$lib/templates/resume/types';
	import { parseShareFragment } from '$lib/share/url';
	import Preview from '$lib/typst/Preview.svelte';

	// Restore from LocalStorage before the form mounts so BasicInfoForm's
	// `untrack`-initialized children pick up the right values on first render.
	// Share-link hash is handled after mount via the import modal.
	const store = new ResumeStore(loadResumeFromStorage() ?? undefined);

	let tab = $state<'form' | 'preview'>('form');
	let shareOpen = $state(false);
	let importPayload = $state<ResumeData | null>(null);
	let importError = $state('');

	const filename = $derived(buildResumeFilename(store.data));

	// Autosave. Reading `serializeResumeJson(store.data)` here traverses every
	// field, so `$effect` re-runs on any nested mutation. The write itself is
	// debounced to 500 ms to avoid thrashing storage on rapid typing.
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	$effect(() => {
		const json = serializeResumeJson(store.data);
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(() => {
			try {
				localStorage.setItem('pdf-by-typst.resume.v1', json);
			} catch {
				// swallowed; see persistence.ts for rationale
			}
		}, 500);
	});

	// Check for a share-link fragment on mount. If valid, surface the import
	// modal; otherwise strip the noisy hash from the URL bar.
	onMount(() => {
		const frag = parseShareFragment(location.hash);
		if (!frag) return;
		if (frag.templateId !== 'resume') return;
		try {
			importPayload = parseResumeJson(frag.json);
		} catch (e) {
			importError = e instanceof Error ? e.message : String(e);
			stripHash();
		}
	});

	function stripHash() {
		history.replaceState(null, '', location.pathname + location.search);
	}

	function onImportAccept(next: ResumeData) {
		store.replaceData(next);
		saveResumeToStorage(next);
		importPayload = null;
		stripHash();
	}

	function onImportCancel() {
		importPayload = null;
		stripHash();
	}

	function resetAll() {
		if (!confirm('フォームの内容を破棄して空の状態に戻しますか？')) return;
		store.reset();
		clearResumeStorage();
	}
</script>

<svelte:head><title>履歴書 - pdf-by-typst</title></svelte:head>

<main class="mx-auto flex h-[100dvh] max-w-7xl flex-col gap-3 p-3 md:p-4">
	<header class="flex flex-wrap items-baseline justify-between gap-2">
		<div class="flex items-baseline gap-3">
			<h1 class="text-xl font-bold">履歴書</h1>
			<a href="/" class="text-sm text-blue-600 hover:underline">← トップ</a>
		</div>
		<div class="flex items-center gap-2 text-sm">
			<button
				type="button"
				onclick={() => (shareOpen = true)}
				class="rounded border border-gray-300 px-3 py-1 hover:bg-gray-100"
			>
				共有リンク
			</button>
			<button
				type="button"
				onclick={resetAll}
				class="rounded border border-gray-300 px-3 py-1 text-gray-600 hover:bg-gray-100"
			>
				リセット
			</button>
		</div>
	</header>

	{#if importError}
		<p class="rounded bg-red-50 p-2 text-xs text-red-800">
			共有リンクの読み込みに失敗: {importError}
		</p>
	{/if}

	<div
		class="flex gap-1 rounded border border-gray-300 bg-gray-100 p-1 text-sm md:hidden"
		role="tablist"
		aria-label="画面切り替え"
	>
		<button
			type="button"
			role="tab"
			aria-selected={tab === 'form'}
			onclick={() => (tab = 'form')}
			class="flex-1 rounded px-3 py-1.5 transition {tab === 'form'
				? 'bg-white font-semibold shadow-sm'
				: 'text-gray-600 hover:bg-gray-200'}"
		>
			フォーム
		</button>
		<button
			type="button"
			role="tab"
			aria-selected={tab === 'preview'}
			onclick={() => (tab = 'preview')}
			class="flex-1 rounded px-3 py-1.5 transition {tab === 'preview'
				? 'bg-white font-semibold shadow-sm'
				: 'text-gray-600 hover:bg-gray-200'}"
		>
			プレビュー
		</button>
	</div>

	<div class="grid min-h-0 flex-1 gap-4 md:grid-cols-2">
		<section
			class="{tab === 'form' ? 'flex' : 'hidden'} min-h-0 flex-col overflow-y-auto pr-1 md:flex"
		>
			{#key store.version}
				<ResumeForm data={store.data} />
			{/key}
		</section>
		<section class="{tab === 'preview' ? 'flex' : 'hidden'} min-h-0 flex-col md:flex">
			<Preview inputs={store.compileInputs} downloadName={filename} />
		</section>
	</div>
</main>

{#if shareOpen}
	<ShareDialog data={store.data} onclose={() => (shareOpen = false)} />
{/if}

{#if importPayload}
	<ImportDialog
		imported={importPayload}
		hasExisting={hasResumeInStorage()}
		onaccept={onImportAccept}
		oncancel={onImportCancel}
	/>
{/if}
