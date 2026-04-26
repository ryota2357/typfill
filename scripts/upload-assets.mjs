#!/usr/bin/env node
// Upload the external binary assets to the configured R2 bucket. Filenames are
// content-hashed (see external-assets.mjs), so re-uploading the exact same
// bytes is a no-op as far as referencing-clients are concerned — the worst
// case is wasted bandwidth on a duplicate PUT.
//
// Required env:
//   R2_BUCKET             — bucket name (e.g. "typfill-assets")
//   CLOUDFLARE_API_TOKEN  — token with R2 Storage:Edit on the account
//   CLOUDFLARE_ACCOUNT_ID — account ID
//
// Wrangler picks up CLOUDFLARE_* automatically.

import { spawnSync } from "node:child_process";
import { externalAssets } from "./external-assets.mjs";

const bucket = process.env.R2_BUCKET;
if (!bucket) {
  console.error("R2_BUCKET env var is required");
  process.exit(1);
}

let failed = false;
for (const asset of Object.values(externalAssets)) {
  const target = `${bucket}/${asset.filename}`;
  console.log(`putting ${asset.key} -> ${target}`);
  const result = spawnSync(
    "pnpm",
    [
      "exec",
      "wrangler",
      "r2",
      "object",
      "put",
      target,
      "--file",
      asset.absPath,
      "--content-type",
      asset.contentType,
      "--remote",
    ],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    console.error(`failed to upload ${asset.key} (exit ${result.status})`);
    failed = true;
  }
}

if (failed) process.exit(1);
