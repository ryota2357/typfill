import { describe, expect, it } from 'vitest';
import { RESUME_SAMPLE_DATA } from './defaults';
import { parseResumeJson, serializeForShare, serializeResumeJson } from './persistence';

describe('resume persistence', () => {
	it('roundtrips sample data through JSON', () => {
		const out = parseResumeJson(serializeResumeJson(RESUME_SAMPLE_DATA));
		expect(out).toEqual(RESUME_SAMPLE_DATA);
	});

	it('roundtrips a photo via base64', () => {
		const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0, 1, 2, 3, 255]);
		const data = { ...RESUME_SAMPLE_DATA, 写真: { vfsPath: '/assets/photo.jpg', bytes } };
		const out = parseResumeJson(serializeResumeJson(data));
		expect(out.写真?.vfsPath).toBe('/assets/photo.jpg');
		expect(Array.from(out.写真?.bytes ?? [])).toEqual(Array.from(bytes));
	});

	it('serializeForShare strips the photo by default', () => {
		const bytes = new Uint8Array([1, 2, 3]);
		const data = { ...RESUME_SAMPLE_DATA, 写真: { vfsPath: '/assets/photo.jpg', bytes } };
		const json = serializeForShare(data, { includeImage: false });
		expect(json).not.toContain('bytesBase64');
		const out = parseResumeJson(json);
		expect(out.写真).toBeNull();
	});

	it('serializeForShare keeps the photo when includeImage is true', () => {
		const bytes = new Uint8Array([1, 2, 3]);
		const data = { ...RESUME_SAMPLE_DATA, 写真: { vfsPath: '/assets/photo.jpg', bytes } };
		const json = serializeForShare(data, { includeImage: true });
		const out = parseResumeJson(json);
		expect(Array.from(out.写真?.bytes ?? [])).toEqual([1, 2, 3]);
	});

	it('rejects payloads from an unknown schema version', () => {
		const raw = JSON.stringify({ version: 999, data: {} });
		expect(() => parseResumeJson(raw)).toThrow(/バージョン/);
	});

	it('rejects payloads with missing required fields', () => {
		const raw = JSON.stringify({ version: 1, data: { 氏名: { 姓: 'a', 名: 'b' } } });
		expect(() => parseResumeJson(raw)).toThrow();
	});

	it('rejects payloads with wrong field types', () => {
		const ok = JSON.parse(serializeResumeJson(RESUME_SAMPLE_DATA));
		ok.data.生年月日 = 'not-a-date';
		expect(() => parseResumeJson(JSON.stringify(ok))).toThrow(/生年月日/);
	});
});
