<script lang="ts">
	import { buildShareUrl } from '$lib/share/url';
	import { compressToEncodedURIComponent } from 'lz-string';
	import { serializeForShare } from '../persistence';
	import type { ResumeData } from '../types';

	let { data, onclose }: { data: ResumeData; onclose: () => void } = $props();

	let includeImage = $state(false);
	let copyStatus = $state<'idle' | 'copied' | 'error'>('idle');

	// Approximate length of the compressed payload. Browsers tolerate very long
	// fragments (32k+ in practice), but the UI warns past ~8000 chars since
	// clipboard apps, chat clients, and QR codes often truncate before that.
	const json = $derived(serializeForShare(data, { includeImage }));
	const encoded = $derived(compressToEncodedURIComponent(json));
	const fragmentChars = $derived(encoded.length);
	const shareUrl = $derived(
		typeof location === 'undefined' ? '' : buildShareUrl({ templateId: 'resume', json })
	);
	const sizeWarning = $derived(fragmentChars > 8000);
	const hasPhoto = $derived(data.写真 !== null);

	async function copy() {
		try {
			await navigator.clipboard.writeText(shareUrl);
			copyStatus = 'copied';
			setTimeout(() => (copyStatus = 'idle'), 2000);
		} catch {
			copyStatus = 'error';
		}
	}

	function onKey(e: KeyboardEvent) {
		if (e.key === 'Escape') onclose();
	}
</script>

<svelte:window onkeydown={onKey} />

<div
	class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
	role="dialog"
	aria-modal="true"
	aria-labelledby="share-title"
>
	<div class="w-full max-w-lg space-y-4 rounded-lg bg-white p-5 shadow-xl">
		<div class="flex items-start justify-between gap-3">
			<h2 id="share-title" class="text-lg font-bold">共有リンクを作成</h2>
			<button
				type="button"
				onclick={onclose}
				aria-label="閉じる"
				class="rounded px-2 py-1 text-gray-500 hover:bg-gray-100"
			>
				✕
			</button>
		</div>

		<p class="text-sm text-gray-700">
			URL のフラグメント（<code>#…</code
			>）に圧縮して埋め込みます。個人情報はサーバーに送信されません。
		</p>

		{#if hasPhoto}
			<label class="flex items-start gap-2 rounded border border-gray-200 p-2 text-sm">
				<input type="checkbox" bind:checked={includeImage} class="mt-0.5" />
				<span>
					<strong>写真を含める</strong>
					<span class="block text-xs text-gray-600">
						画像データを base64 で埋め込むため、リンクが非常に長くなります。
					</span>
				</span>
			</label>
		{:else}
			<p class="rounded border border-gray-200 bg-gray-50 p-2 text-xs text-gray-600">
				写真は未設定のため、共有リンクには含まれません。
			</p>
		{/if}

		<div class="space-y-1">
			<div class="flex items-baseline justify-between text-xs text-gray-600">
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
				class="h-20 w-full resize-none rounded border border-gray-300 p-2 font-mono text-xs break-all"
			></textarea>
		</div>

		<div class="flex items-center justify-end gap-2">
			{#if copyStatus === 'copied'}
				<span class="text-sm text-green-700">✓ コピーしました</span>
			{:else if copyStatus === 'error'}
				<span class="text-sm text-red-700">コピーに失敗しました</span>
			{/if}
			<button
				type="button"
				onclick={copy}
				class="rounded bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-700"
			>
				クリップボードにコピー
			</button>
		</div>
	</div>
</div>
