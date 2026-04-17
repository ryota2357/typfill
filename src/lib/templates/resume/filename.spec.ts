import { describe, expect, it } from 'vitest';
import { buildResumeFilename } from './filename';
import { RESUME_EMPTY_DATA, RESUME_SAMPLE_DATA } from './defaults';

describe('buildResumeFilename', () => {
	const frozenNow = new Date(2026, 3, 17); // 2026-04-17, local time

	it('joins 姓+名 and appends today when 日付 is auto', () => {
		expect(buildResumeFilename(RESUME_SAMPLE_DATA, frozenNow)).toBe(
			'resume_履歴書太郎_20260417'.concat('.pdf')
		);
	});

	it('falls back to date-only when 氏名 is empty', () => {
		expect(buildResumeFilename(RESUME_EMPTY_DATA, frozenNow)).toBe('resume_20260417.pdf');
	});

	it('uses explicit 日付 when not auto', () => {
		const data = { ...RESUME_SAMPLE_DATA, 日付: { year: 2025, month: 1, day: 2 } };
		expect(buildResumeFilename(data, frozenNow)).toBe('resume_履歴書太郎_20250102.pdf');
	});

	it('strips filesystem-unsafe characters from 氏名', () => {
		const data = {
			...RESUME_EMPTY_DATA,
			氏名: { 姓: 'a/b', 名: 'c:d*e' }
		};
		expect(buildResumeFilename(data, frozenNow)).toBe('resume_a_bc_d_e_20260417.pdf');
	});

	it('handles missing 姓 or 名 individually', () => {
		const onlyFirst = { ...RESUME_EMPTY_DATA, 氏名: { 姓: '', 名: '太郎' } };
		expect(buildResumeFilename(onlyFirst, frozenNow)).toBe('resume_太郎_20260417.pdf');

		const onlyLast = { ...RESUME_EMPTY_DATA, 氏名: { 姓: '山田', 名: '' } };
		expect(buildResumeFilename(onlyLast, frozenNow)).toBe('resume_山田_20260417.pdf');
	});

	it('zero-pads single-digit month/day', () => {
		const data = { ...RESUME_SAMPLE_DATA, 日付: { year: 2024, month: 3, day: 5 } };
		expect(buildResumeFilename(data, frozenNow)).toBe('resume_履歴書太郎_20240305.pdf');
	});
});
