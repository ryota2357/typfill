import { afterAll, describe, expect, it } from "vitest";
import { createTypstClient, type TypstClient } from "$lib/typst/worker-client";
import { buildCompileSources } from "../types";
import { RESUME_SAMPLE_DATA } from "./defaults";
import { resumeModule } from "./module";

// End-to-end smoke test: the codegen output must actually compile through the
// Typst worker. This is the "ワーカーがエラーを返さない" half of the Phase 1
// round-trip assertion — a stricter SVG diff against an upstream-compiled
// baseline is deferred to Phase 2 when the form supplies matching defaults.

let client: TypstClient | undefined;

afterAll(() => {
  client?.dispose();
});

describe("resume codegen — worker compile", () => {
  it("compiles RESUME_SAMPLE_DATA with no error diagnostics", async () => {
    client = createTypstClient();
    const sources = buildCompileSources(resumeModule, RESUME_SAMPLE_DATA);
    const { svg, diagnostics } = await client.compile(
      sources,
      resumeModule.mainPath,
    );

    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors).toEqual([]);
    expect(svg).toMatch(/^<svg[\s>]/);
  }, 30_000);
});
