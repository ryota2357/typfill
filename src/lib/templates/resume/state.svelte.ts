import type { TypstAssets, TypstSources } from '$lib/typst/protocol';
import { buildCompileAssets, buildCompileSources } from '../types';
import { RESUME_EMPTY_DATA } from './defaults';
import { resumeModule } from './module';
import type { ResumeData, TimelineEntry } from './types';

const PHOTO_VFS_PATH = '/assets/photo.jpg';

export type CompileInputs = {
	sources: TypstSources;
	assets: TypstAssets;
	mainPath: string;
};

// Reactive container for the resume form. `data` is the deeply-proxied state
// every form component binds to. `compileInputs` is the consolidated bundle
// the preview/worker consume — debouncing happens downstream in the preview.
//
// `version` bumps whenever `data` is wholesale replaced (restore from storage,
// import from share link, reset). The page uses `{#key store.version}` to
// remount the form so `untrack`-initialized child state (e.g. the 作成日付
// radio mode in BasicInfoForm) is re-seeded from the new data.
export class ResumeStore {
	data: ResumeData = $state(structuredClone(RESUME_EMPTY_DATA));
	version = $state(0);

	compileInputs: CompileInputs = $derived.by(() => ({
		sources: buildCompileSources(resumeModule, this.data),
		assets: buildCompileAssets(resumeModule, this.data),
		mainPath: resumeModule.mainPath
	}));

	constructor(initial?: ResumeData) {
		if (initial) this.data = initial;
	}

	replaceData(next: ResumeData): void {
		this.data = next;
		this.version++;
	}

	reset(): void {
		this.replaceData(structuredClone(RESUME_EMPTY_DATA));
	}
}

// Form components receive `data` (the proxy) directly per the
// `Component<{ data: T }>` interface; these helpers let them mutate the photo
// field without reaching back to the `ResumeStore` instance.
export function setResumePhoto(data: ResumeData, bytes: Uint8Array): void {
	data.写真 = { vfsPath: PHOTO_VFS_PATH, bytes };
}

export function clearResumePhoto(data: ResumeData): void {
	data.写真 = null;
}

// New timeline rows default to the current year/month so users edit forward
// from a sensible value rather than from `0年0月`.
export function newTimelineEntry(): TimelineEntry {
	const now = new Date();
	return { year: now.getFullYear(), month: now.getMonth() + 1, content: '' };
}

// In-place reorder with bounds clamping. Used by the timeline up/down buttons.
export function moveItem<T>(list: T[], from: number, to: number): void {
	if (from < 0 || from >= list.length) return;
	const clamped = Math.max(0, Math.min(list.length - 1, to));
	if (from === clamped) return;
	const [item] = list.splice(from, 1);
	list.splice(clamped, 0, item);
}
