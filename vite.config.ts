import { createReadStream } from "node:fs";
import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig, type Plugin } from "vitest/config";
import { externalAssets } from "./scripts/external-assets.mjs";

// Resolve the public base URL for binary assets that ship via R2 instead of
// the Workers static-assets bundle. In CI/production the URL comes from
// `PUBLIC_ASSETS_BASE_URL` (e.g. `https://pub-xxxx.r2.dev`); locally it
// stays empty and we serve the same files via a dev-only middleware below
// so contributors don't need any R2 access just to run the app.
const ASSETS_BASE_URL = process.env.PUBLIC_ASSETS_BASE_URL ?? "";
const DEV_PREFIX = "/_external";

// Reject scheme-less values (e.g. "assets.example.com"): the worker would
// resolve them relative to its own location and 404 against the app origin.
if (ASSETS_BASE_URL && !/^https?:\/\//.test(ASSETS_BASE_URL)) {
  throw new Error(
    `PUBLIC_ASSETS_BASE_URL must be an absolute URL (got: ${JSON.stringify(
      ASSETS_BASE_URL,
    )}). Include the https:// scheme.`,
  );
}

function urlFor(filename: string): string {
  return ASSETS_BASE_URL
    ? `${ASSETS_BASE_URL.replace(/\/$/, "")}/${filename}`
    : `${DEV_PREFIX}/${filename}`;
}

// Serve external assets out of node_modules / cdn-assets at /_external/<filename>
// during `vite dev` and `vite preview`, mirroring the dev URLs the worker uses
// when no `PUBLIC_ASSETS_BASE_URL` is set. Production builds skip this entirely
// — the URLs in the bundle point at R2 directly.
function externalAssetsServer(): Plugin {
  const byUrl = new Map(
    Object.values(externalAssets).map((a) => [
      `${DEV_PREFIX}/${a.filename}`,
      a,
    ]),
  );
  return {
    name: "typfill:external-assets-server",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const asset = req.url ? byUrl.get(req.url.split("?")[0]) : undefined;
        if (!asset) return next();
        res.setHeader("content-type", asset.contentType);
        res.setHeader("cache-control", "no-cache");
        createReadStream(asset.absPath).pipe(res);
      });
    },
  };
}

export default defineConfig({
  plugins: [externalAssetsServer(), tailwindcss(), sveltekit()],
  define: {
    __TYPST_COMPILER_WASM_URL__: JSON.stringify(
      urlFor(externalAssets.compilerWasm.filename),
    ),
    __TYPST_RENDERER_WASM_URL__: JSON.stringify(
      urlFor(externalAssets.rendererWasm.filename),
    ),
    __FONT_URL__: JSON.stringify(urlFor(externalAssets.font.filename)),
  },
  test: {
    expect: { requireAssertions: true },
    projects: [
      {
        extends: "./vite.config.ts",
        test: {
          name: "client",
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: "chromium", headless: true }],
          },
          include: ["src/**/*.svelte.{test,spec}.{js,ts}"],
          exclude: ["src/lib/server/**"],
        },
      },

      {
        extends: "./vite.config.ts",
        test: {
          name: "server",
          environment: "node",
          include: ["src/**/*.{test,spec}.{js,ts}"],
          exclude: ["src/**/*.svelte.{test,spec}.{js,ts}"],
        },
      },
    ],
  },
});
