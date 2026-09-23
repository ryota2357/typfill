import { describe, expect, it } from "vitest";
import { deserialize, EMPTY_PROPS, SAMPLE_PROPS, serialize } from "./index";

describe("soufujo template codec", () => {
  it("roundtrips EMPTY_PROPS", () => {
    expect(deserialize(serialize(EMPTY_PROPS))).toEqual(EMPTY_PROPS);
  });

  it("roundtrips SAMPLE_PROPS with nested enclosures", () => {
    expect(deserialize(serialize(SAMPLE_PROPS))).toEqual(SAMPLE_PROPS);
  });

  it("returns undefined for malformed payloads", () => {
    const mangled = serialize({
      ...EMPTY_PROPS,
      件名: 42 as unknown as string,
    });
    expect(deserialize(mangled)).toBeUndefined();
  });
});
