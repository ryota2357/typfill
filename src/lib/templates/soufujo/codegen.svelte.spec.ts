import { afterAll, describe, expect, it } from "vitest";
import { createTypstClient, type TypstClient } from "$lib/typst/worker-client";
import { buildCompileInputs } from "./compile";
import { EMPTY_PROPS, SAMPLE_PROPS } from "./defaults";

// End-to-end smoke test: the codegen output must actually compile through the
// Typst worker against the real upstream `lib.typ`.

let client: TypstClient | undefined;

afterAll(() => {
  client?.dispose();
});

describe("soufujo codegen — worker compile", () => {
  it("compiles SAMPLE_PROPS with no error diagnostics", async () => {
    client ??= createTypstClient();
    const { svg, diagnostics } = await client.compile(
      buildCompileInputs(SAMPLE_PROPS),
    );

    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors).toEqual([]);
    expect(svg).toMatch(/^<svg[\s>]/);
  }, 30_000);

  // A fresh page starts from EMPTY_PROPS, where every 宛先 / 差出人 field is
  // omitted; the preview must still compile.
  it("compiles EMPTY_PROPS with no error diagnostics", async () => {
    client ??= createTypstClient();
    const { diagnostics } = await client.compile(
      buildCompileInputs(EMPTY_PROPS),
    );

    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors).toEqual([]);
  }, 30_000);
});
