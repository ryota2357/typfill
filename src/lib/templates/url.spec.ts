import { describe, expect, it } from "vitest";
import {
  buildShareFragment,
  buildShareUrl,
  parseShareFragment,
} from "./url";

describe("share URL", () => {
  it("roundtrips a payload through build/parse", () => {
    const share = { templateId: "resume", payload: "abc123" };
    const frag = buildShareFragment(share);
    expect(frag).toBe("#t=resume&data=abc123");
    expect(parseShareFragment(frag)).toEqual(share);
  });

  it("accepts a fragment without the leading #", () => {
    const share = { templateId: "resume", payload: "abc" };
    const frag = buildShareFragment(share).slice(1);
    expect(parseShareFragment(frag)).toEqual(share);
  });

  it("URL-encodes templateId but leaves payload verbatim", () => {
    // Template ids are controlled by us (ASCII); payloads are already
    // URL-safe (lz-string's `compressToEncodedURIComponent`). Round-tripping
    // payload verbatim avoids accidental double-encoding.
    const share = { templateId: "re sume", payload: "a+b/c" };
    const frag = buildShareFragment(share);
    expect(frag).toBe("#t=re%20sume&data=a+b/c");
    expect(parseShareFragment(frag)).toEqual({
      templateId: "re sume",
      payload: "a+b/c",
    });
  });

  it("returns null for an empty fragment", () => {
    expect(parseShareFragment("")).toBeNull();
    expect(parseShareFragment("#")).toBeNull();
  });

  it("returns null when required keys are missing", () => {
    expect(parseShareFragment("#t=resume")).toBeNull();
    expect(parseShareFragment("#data=xyz")).toBeNull();
  });

  it("buildShareUrl concatenates location parts with the fragment", () => {
    const url = buildShareUrl(
      { templateId: "resume", payload: "xyz" },
      { origin: "https://example.com", pathname: "/resume", search: "?a=1" },
    );
    expect(url).toBe("https://example.com/resume?a=1#t=resume&data=xyz");
  });
});
