import { describe, expect, it } from 'vitest';
import { buildShareUrl, encodeShareFragment, parseShareFragment } from './url';

describe('share URL', () => {
	it('roundtrips a payload through encode/parse', () => {
		const payload = { templateId: 'resume', json: '{"hello":"世界","n":123}' };
		const frag = encodeShareFragment(payload);
		expect(frag).toMatch(/^#t=resume&data=/);
		expect(parseShareFragment(frag)).toEqual(payload);
	});

	it('accepts a fragment without the leading #', () => {
		const payload = { templateId: 'resume', json: '{"a":1}' };
		const frag = encodeShareFragment(payload).slice(1);
		expect(parseShareFragment(frag)).toEqual(payload);
	});

	it('returns null for an empty fragment', () => {
		expect(parseShareFragment('')).toBeNull();
		expect(parseShareFragment('#')).toBeNull();
	});

	it('returns null when required keys are missing', () => {
		expect(parseShareFragment('#t=resume')).toBeNull();
		expect(parseShareFragment('#data=xyz')).toBeNull();
	});

	it('returns null for corrupt data payloads', () => {
		expect(parseShareFragment('#t=resume&data=@@@')).toBeNull();
	});

	it('buildShareUrl concatenates location parts with the fragment', () => {
		const url = buildShareUrl(
			{ templateId: 'resume', json: '{"x":1}' },
			{ origin: 'https://example.com', pathname: '/resume', search: '?a=1' }
		);
		expect(url.startsWith('https://example.com/resume?a=1#t=resume&data=')).toBe(true);
	});
});
