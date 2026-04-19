// Share URL fragment structure. The `payload` value is produced by a
// template's `codec.serialize()` (lz-string + URL-safe base64); `url.ts` only
// knows how to lay out the fragment around it.

export type SharePayload = { templateId: string; payload: string };

// Builds the fragment portion including the leading `#`.
export function buildShareFragment({
  templateId,
  payload,
}: SharePayload): string {
  return `#t=${encodeURIComponent(templateId)}&data=${payload}`;
}

// Parses a `location.hash` string (with or without the leading `#`). Returns
// null when the fragment is missing required keys. Validation of `payload`
// itself is the codec's responsibility.
//
// We parse manually rather than via `URLSearchParams` because the latter
// implements `application/x-www-form-urlencoded` and decodes `+` as space —
// lz-string's URI-safe alphabet includes `+`, so round-tripping payload
// verbatim is required.
export function parseShareFragment(hash: string): SharePayload | null {
  if (!hash) return null;
  const body = hash.startsWith("#") ? hash.slice(1) : hash;
  if (!body) return null;
  let templateId: string | null = null;
  let payload: string | null = null;
  for (const part of body.split("&")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const key = part.slice(0, eq);
    const value = part.slice(eq + 1);
    if (key === "t") templateId = decodeURIComponent(value);
    else if (key === "data") payload = value;
  }
  if (!templateId || !payload) return null;
  return { templateId, payload };
}

// Build the full share URL for the current document. `location` is injectable
// so tests and SSR paths don't touch globals.
export function buildShareUrl(
  share: SharePayload,
  location: {
    origin: string;
    pathname: string;
    search: string;
  } = globalThis.location,
): string {
  return `${location.origin}${location.pathname}${location.search}${buildShareFragment(share)}`;
}
