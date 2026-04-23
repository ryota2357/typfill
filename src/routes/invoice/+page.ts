// Worker client + WASM entry imports touch browser-only APIs at module scope,
// so SSR is disabled. Prerender produces a minimal HTML shell that hydrates
// client-side — enough for adapter-static to emit a directly-servable file.
export const ssr = false;
export const prerender = true;
