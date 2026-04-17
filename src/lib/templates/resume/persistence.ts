import { base64ToBytes, bytesToBase64 } from '$lib/base64';
import type { Contact, ResumeData, ResumeDate, ResumeParams, TimelineEntry } from './types';

// LocalStorage key and schema version for the resume form. The key is
// namespaced per template (CONSEPT_AND_PLAN §1). Bump `SCHEMA_VERSION` and
// handle the older shape in `parseResumeJson` when adding/renaming fields.
export const RESUME_STORAGE_KEY = 'pdf-by-typst.resume.v1';
export const SCHEMA_VERSION = 1;

// Wire shape: bytes must be base64 for JSON roundtrip. Everything else matches
// the runtime `ResumeData` verbatim.
type ResumePhotoWire = { vfsPath: string; bytesBase64: string };
type ResumeDataWire = Omit<ResumeData, '写真'> & {
	写真: ResumePhotoWire | null;
};
type Envelope = { version: number; data: ResumeDataWire };

function toWire(data: ResumeData): ResumeDataWire {
	return {
		...data,
		写真: data.写真
			? { vfsPath: data.写真.vfsPath, bytesBase64: bytesToBase64(data.写真.bytes) }
			: null
	};
}

function fromWire(w: ResumeDataWire): ResumeData {
	return {
		...w,
		写真: w.写真 ? { vfsPath: w.写真.vfsPath, bytes: base64ToBytes(w.写真.bytesBase64) } : null
	};
}

export function serializeResumeJson(data: ResumeData): string {
	const env: Envelope = { version: SCHEMA_VERSION, data: toWire(data) };
	return JSON.stringify(env);
}

// Parses and validates the envelope. Throws on any structural mismatch so
// callers (autoload, import modal) can fall back or surface an error.
export function parseResumeJson(raw: string): ResumeData {
	const parsed: unknown = JSON.parse(raw);
	if (!isRecord(parsed)) throw new Error('不正な形式です');
	if (parsed.version !== SCHEMA_VERSION) {
		throw new Error(`未対応のバージョン: ${String(parsed.version)}`);
	}
	if (!isRecord(parsed.data)) throw new Error('data フィールドがありません');
	return fromWire(validateWire(parsed.data));
}

// Build a share payload. When `includeImage` is false we strip 写真 before
// serialization (CONSEPT_AND_PLAN §1 default). When true the photo bytes travel
// base64-encoded inside the payload — the UI is expected to surface a size
// warning.
export function serializeForShare(
	data: ResumeData,
	{ includeImage }: { includeImage: boolean }
): string {
	return serializeResumeJson(includeImage ? data : { ...data, 写真: null });
}

// --- Storage helpers ---------------------------------------------------------

export function loadResumeFromStorage(): ResumeData | null {
	if (typeof localStorage === 'undefined') return null;
	const raw = localStorage.getItem(RESUME_STORAGE_KEY);
	if (!raw) return null;
	try {
		return parseResumeJson(raw);
	} catch {
		return null;
	}
}

export function saveResumeToStorage(data: ResumeData): void {
	if (typeof localStorage === 'undefined') return;
	try {
		localStorage.setItem(RESUME_STORAGE_KEY, serializeResumeJson(data));
	} catch {
		// Quota exceeded or storage disabled — intentionally swallowed. Autosave
		// failures must not break the form. Users can still export PDF.
	}
}

export function clearResumeStorage(): void {
	if (typeof localStorage === 'undefined') return;
	localStorage.removeItem(RESUME_STORAGE_KEY);
}

export function hasResumeInStorage(): boolean {
	if (typeof localStorage === 'undefined') return false;
	return localStorage.getItem(RESUME_STORAGE_KEY) !== null;
}

// --- Validation --------------------------------------------------------------

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function validateWire(raw: Record<string, unknown>): ResumeDataWire {
	return {
		日付: raw.日付 === 'auto' ? 'auto' : validateDate(raw.日付, '日付'),
		氏名: validateName(raw.氏名, '氏名'),
		氏名ふりがな: validateName(raw.氏名ふりがな, '氏名ふりがな'),
		生年月日: validateDate(raw.生年月日, '生年月日'),
		性別: asString(raw.性別, '性別'),
		写真: validatePhoto(raw.写真),
		現住所: validateContact(raw.現住所, '現住所'),
		連絡先: validateContact(raw.連絡先, '連絡先'),
		学歴: validateTimeline(raw.学歴, '学歴'),
		職歴: validateTimeline(raw.職歴, '職歴'),
		'免許・資格': validateTimeline(raw['免許・資格'], '免許・資格'),
		志望動機: asString(raw.志望動機, '志望動機'),
		本人希望記入欄: asString(raw.本人希望記入欄, '本人希望記入欄'),
		params: validateParams(raw.params)
	};
}

function asString(v: unknown, field: string): string {
	if (typeof v !== 'string') throw new Error(`${field} は文字列が必要です`);
	return v;
}

function asNumber(v: unknown, field: string): number {
	if (typeof v !== 'number' || !Number.isFinite(v)) {
		throw new Error(`${field} は数値が必要です`);
	}
	return v;
}

function validateName(v: unknown, field: string) {
	if (!isRecord(v)) throw new Error(`${field} が不正です`);
	return { 姓: asString(v.姓, `${field}.姓`), 名: asString(v.名, `${field}.名`) };
}

function validateDate(v: unknown, field: string): ResumeDate {
	if (!isRecord(v)) throw new Error(`${field} が不正です`);
	return {
		year: asNumber(v.year, `${field}.year`),
		month: asNumber(v.month, `${field}.month`),
		day: asNumber(v.day, `${field}.day`)
	};
}

function validateContact(v: unknown, field: string): Contact {
	if (!isRecord(v)) throw new Error(`${field} が不正です`);
	return {
		郵便番号: asString(v.郵便番号, `${field}.郵便番号`),
		住所: asString(v.住所, `${field}.住所`),
		住所ふりがな: asString(v.住所ふりがな, `${field}.住所ふりがな`),
		電話: asString(v.電話, `${field}.電話`),
		'E-mail': asString(v['E-mail'], `${field}.E-mail`)
	};
}

function validateTimeline(v: unknown, field: string): TimelineEntry[] {
	if (!Array.isArray(v)) throw new Error(`${field} は配列が必要です`);
	return v.map((entry, i) => {
		if (!isRecord(entry)) throw new Error(`${field}[${i}] が不正です`);
		return {
			year: asNumber(entry.year, `${field}[${i}].year`),
			month: asNumber(entry.month, `${field}[${i}].month`),
			content: asString(entry.content, `${field}[${i}].content`)
		};
	});
}

function validatePhoto(v: unknown): ResumePhotoWire | null {
	if (v === null || v === undefined) return null;
	if (!isRecord(v)) throw new Error('写真 が不正です');
	return {
		vfsPath: asString(v.vfsPath, '写真.vfsPath'),
		bytesBase64: asString(v.bytesBase64, '写真.bytesBase64')
	};
}

function validateParams(v: unknown): ResumeParams {
	if (!isRecord(v)) throw new Error('params が不正です');
	return {
		'学歴・職歴の最小行数': asNumber(v['学歴・職歴の最小行数'], 'params.学歴・職歴の最小行数'),
		学歴と職歴の間の空行数: asNumber(v.学歴と職歴の間の空行数, 'params.学歴と職歴の間の空行数'),
		'免許・資格の最小行数': asNumber(v['免許・資格の最小行数'], 'params.免許・資格の最小行数'),
		志望動機の高さ: asString(v.志望動機の高さ, 'params.志望動機の高さ'),
		本人希望記入欄の高さ: asString(v.本人希望記入欄の高さ, 'params.本人希望記入欄の高さ')
	};
}
