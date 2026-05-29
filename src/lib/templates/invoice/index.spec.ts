import { describe, expect, it } from "vitest";
import { deserialize, EMPTY_PROPS, SAMPLE_PROPS, serialize } from "./index";

describe("invoice template codec", () => {
  it("roundtrips EMPTY_PROPS", () => {
    expect(deserialize(serialize(EMPTY_PROPS))).toEqual(EMPTY_PROPS);
  });

  it("roundtrips SAMPLE_PROPS with nested items", () => {
    expect(deserialize(serialize(SAMPLE_PROPS))).toEqual(SAMPLE_PROPS);
  });

  it("returns undefined for malformed payloads", () => {
    const mangled = serialize({
      ...EMPTY_PROPS,
      title: 42 as unknown as string,
    });
    expect(deserialize(mangled)).toBeUndefined();
  });
});
