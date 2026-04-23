import { afterAll, describe, expect, it } from "vitest";
import { createTypstClient, type TypstClient } from "$lib/typst/worker-client";
import { buildCompileInputs } from "./compile";
import { SAMPLE_FIELDS } from "./defaults";

// End-to-end smoke test: the codegen output must actually compile through the
// Typst worker against the real `lib.typ` we copied from upstream.

let client: TypstClient | undefined;

afterAll(() => {
  client?.dispose();
});

describe("invoice codegen — worker compile", () => {
  it("compiles SAMPLE_FIELDS with no error diagnostics", async () => {
    client = createTypstClient();
    const { svg, diagnostics } = await client.compile(
      buildCompileInputs(SAMPLE_FIELDS),
    );

    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors).toEqual([]);
    expect(svg).toMatch(/^<svg[\s>]/);
  }, 30_000);
});
