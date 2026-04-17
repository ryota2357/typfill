<script lang="ts">
	import { ResumeStore } from '$lib/templates/resume/state.svelte';
	import ResumeForm from '$lib/templates/resume/ui/ResumeForm.svelte';
	import Preview from '$lib/typst/Preview.svelte';

	const store = new ResumeStore();
</script>

<svelte:head><title>履歴書 - pdf-by-typst</title></svelte:head>

<main class="mx-auto max-w-7xl p-4">
	<header class="mb-4 flex items-baseline justify-between">
		<h1 class="text-xl font-bold">履歴書</h1>
		<a href="/" class="text-sm text-blue-600 hover:underline">← トップ</a>
	</header>

	<div class="grid gap-6 md:grid-cols-2 md:gap-4">
		<section class="md:max-h-[calc(100vh-6rem)] md:overflow-y-auto md:pr-2">
			<ResumeForm data={store.data} />
		</section>
		<section class="md:sticky md:top-4 md:max-h-[calc(100vh-6rem)]">
			<Preview inputs={store.compileInputs} downloadName="resume.pdf" />
		</section>
	</div>
</main>
