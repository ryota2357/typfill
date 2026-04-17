// Uint8Array <-> base64 bridge for JSON roundtrips (LocalStorage / share links).
//
// We can't use `btoa(String.fromCharCode(...bytes))` directly on large arrays
// because spread reaches JS's argument-count limit; chunk into 32 KB blocks.

const CHUNK = 0x8000;

export function bytesToBase64(bytes: Uint8Array): string {
	let binary = '';
	for (let i = 0; i < bytes.length; i += CHUNK) {
		binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
	}
	return btoa(binary);
}

export function base64ToBytes(b64: string): Uint8Array {
	const binary = atob(b64);
	const out = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
	return out;
}
