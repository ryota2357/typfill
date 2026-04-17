import {
	compressToEncodedURIComponent,
	decompressFromEncodedURIComponent
} from 'lz-string';

// A share link embeds the template id plus an lz-string + URL-safe-base64
// compressed JSON payload in the URL fragment (CONSEPT_AND_PLAN §1). The
// fragment never reaches the server's access logs.

export type SharePayload = { templateId: string; json: string };

// Builds the fragment portion including the leading `#`.
export function encodeShareFragment({ templateId, json }: SharePayload): string {
	const encoded = compressToEncodedURIComponent(json);
	return `#t=${encodeURIComponent(templateId)}&data=${encoded}`;
}

// Parses a `location.hash` string (with or without the leading `#`). Returns
// null when the fragment is missing required keys or the compressed payload is
// malformed.
export function parseShareFragment(hash: string): SharePayload | null {
	if (!hash) return null;
	const body = hash.startsWith('#') ? hash.slice(1) : hash;
	if (!body) return null;
	const params = new URLSearchParams(body);
	const templateId = params.get('t');
	const data = params.get('data');
	if (!templateId || !data) return null;
	const json = decompressFromEncodedURIComponent(data);
	if (!json) return null;
	return { templateId, json };
}

// Build the full share URL for the current document. `location` is injectable
// so tests and SSR paths don't touch globals.
export function buildShareUrl(
	payload: SharePayload,
	location: { origin: string; pathname: string; search: string } = globalThis.location
): string {
	return `${location.origin}${location.pathname}${location.search}${encodeShareFragment(payload)}`;
}
