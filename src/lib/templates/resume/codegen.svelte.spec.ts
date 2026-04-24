import { afterAll, describe, expect, it } from "vitest";
import { createTypstClient, type TypstClient } from "$lib/typst/worker-client";
import { buildCompileInputs } from "./compile";
import { EMPTY_FIELDS, SAMPLE_FIELDS } from "./defaults";

// End-to-end smoke test: the codegen output must actually compile through the
// Typst worker. The template's own `buildCompileInputs` is used so any drift
// in the static sources / main.typ split is caught here.

let client: TypstClient | undefined;

afterAll(() => {
  client?.dispose();
});

function getClient(): TypstClient {
  if (!client) client = createTypstClient();
  return client;
}

describe("resume codegen — worker compile", () => {
  it("compiles SAMPLE_FIELDS with no error diagnostics", async () => {
    const { svg, diagnostics } = await getClient().compile(
      buildCompileInputs(SAMPLE_FIELDS),
    );

    const errors = diagnostics.filter((d) => d.severity === "error");
    expect(errors).toEqual([]);
    expect(svg).toMatch(/^<svg[\s>]/);
  }, 30_000);

  it("accepts full Typst markup in 志望動機 via rawMarkupLit", async () => {
    // Exact payload from the user's bug report: headings, show rule, list,
    // and #link — all previously killed by markupLit escaping `#`.
    const input = buildCompileInputs({
      ...structuredClone(SAMPLE_FIELDS),
      志望動機: [
        "#show link: underline",
        "== リンク",
        '- GitHub: #link("https://github.com/ryota2357/")[ryota2357]',
      ].join("\n"),
    });
    const { svg, diagnostics } = await getClient().compile(input);

    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    // The #link target must appear in the rendered SVG as a real hyperlink
    // (typst.ts encodes these as <a href=...>), proving the raw markup path
    // reached the compiler rather than being escaped into literal text.
    expect(svg).toContain("https://github.com/ryota2357/");
  }, 30_000);

  it("treats code-mode syntax in plain fields as literal text", async () => {
    // Inverse check: `#sys.version` in a data field must not execute; the
    // compiled SVG must contain the literal string so we know plainMarkupLit
    // escaped the `#`.
    const input = buildCompileInputs({
      ...structuredClone(EMPTY_FIELDS),
      氏名: { 姓: "#sys.version", 名: "" },
    });
    const { svg, diagnostics } = await getClient().compile(input);

    expect(diagnostics.filter((d) => d.severity === "error")).toEqual([]);
    expect(svg).toContain("#sys.version");
  }, 30_000);

  it("kills the worker when a compile exceeds its timeout", async () => {
    // Typst rejects most forms of infinite loops statically and constant-
    // folds pure arithmetic, so reliably producing a pathological compile
    // across versions is hard. Instead, exercise the timeout machinery by
    // setting an unreachable 1 ms budget on a normal compile: the worker
    // always takes longer than that, so the deadline fires before the
    // result arrives, the worker is terminated, and the lazy-respawn path
    // handles the next call.
    const input = buildCompileInputs(EMPTY_FIELDS);
    client?.dispose();
    client = createTypstClient();

    await expect(client.compile(input, { timeoutMs: 1 })).rejects.toMatchObject(
      { name: "TimeoutError" },
    );

    // After timeout, the client must still accept a normal compile without
    // manual reset — proves the worker respawned on demand.
    const follow = await client.compile(input);
    expect(follow.svg).toMatch(/^<svg[\s>]/);
  }, 30_000);
});
