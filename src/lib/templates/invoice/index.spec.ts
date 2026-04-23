import { describe, expect, it } from "vitest";
import { deserialize, EMPTY_FIELDS, SAMPLE_FIELDS, serialize } from "./index";

describe("invoice template codec", () => {
  it("roundtrips EMPTY_FIELDS", () => {
    expect(deserialize(serialize(EMPTY_FIELDS))).toEqual(EMPTY_FIELDS);
  });

  it("roundtrips SAMPLE_FIELDS with nested items", () => {
    expect(deserialize(serialize(SAMPLE_FIELDS))).toEqual(SAMPLE_FIELDS);
  });

  it("returns undefined for malformed payloads", () => {
    const mangled = serialize({
      ...EMPTY_FIELDS,
      title: 42 as unknown as string,
    });
    expect(deserialize(mangled)).toBeUndefined();
  });
});
