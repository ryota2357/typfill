import adapter from "@sveltejs/adapter-static";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    // Force runes mode for the project, except for libraries. Can be removed in svelte 6.
    runes: ({ filename }) =>
      filename.split(/[/\\]/).includes("node_modules") ? undefined : true,
  },
  kit: {
    // Fully static output for Cloudflare Pages. Every route sets
    // `ssr = false; prerender = true`, so each one emits a minimal HTML
    // shell that hydrates client-side — no server runtime required. The
    // fallback also doubles as a SPA catch-all so unknown paths load the
    // client router instead of a raw 404 from the CDN.
    adapter: adapter({ fallback: "index.html" }),
  },
};

export default config;
