import { describe, expect, it } from 'vitest';
import { clearResumePhoto, moveItem, newTimelineEntry, setResumePhoto } from './state.svelte';
import { RESUME_EMPTY_DATA } from './defaults';
import type { ResumeData } from './types';

function clone(data: ResumeData): ResumeData {
	return structuredClone(data);
}

describe('moveItem', () => {
	it('moves an item upward', () => {
		const list = ['a', 'b', 'c', 'd'];
		moveItem(list, 2, 0);
		expect(list).toEqual(['c', 'a', 'b', 'd']);
	});

	it('moves an item downward', () => {
		const list = ['a', 'b', 'c', 'd'];
		moveItem(list, 1, 3);
		expect(list).toEqual(['a', 'c', 'd', 'b']);
	});

	it('clamps the target index to list bounds', () => {
		const list = ['a', 'b', 'c'];
		moveItem(list, 0, -5);
		expect(list).toEqual(['a', 'b', 'c']);
		moveItem(list, 0, 99);
		expect(list).toEqual(['b', 'c', 'a']);
	});

	it('is a no-op when source equals (clamped) target', () => {
		const list = ['a', 'b', 'c'];
		moveItem(list, 1, 1);
		expect(list).toEqual(['a', 'b', 'c']);
	});

	it('ignores out-of-range source', () => {
		const list = ['a', 'b'];
		moveItem(list, 5, 0);
		expect(list).toEqual(['a', 'b']);
		moveItem(list, -1, 0);
		expect(list).toEqual(['a', 'b']);
	});
});

describe('newTimelineEntry', () => {
	it('returns a row with the current year/month and empty content', () => {
		const now = new Date();
		const entry = newTimelineEntry();
		expect(entry.year).toBe(now.getFullYear());
		expect(entry.month).toBe(now.getMonth() + 1);
		expect(entry.content).toBe('');
	});
});

describe('setResumePhoto / clearResumePhoto', () => {
	it('stores bytes under a stable VFS path', () => {
		const data = clone(RESUME_EMPTY_DATA);
		const bytes = new Uint8Array([1, 2, 3]);
		setResumePhoto(data, bytes);
		expect(data.写真).not.toBeNull();
		expect(data.写真?.bytes).toBe(bytes);
		expect(data.写真?.vfsPath.startsWith('/')).toBe(true);
	});

	it('clears the photo back to null', () => {
		const data = clone(RESUME_EMPTY_DATA);
		setResumePhoto(data, new Uint8Array([0]));
		clearResumePhoto(data);
		expect(data.写真).toBeNull();
	});
});
