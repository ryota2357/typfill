import { describe, expect, it } from "vitest";
import { SchemaValidationError } from "../codec";
import { deserialize, serialize } from "./codec";
import { EMPTY_FIELDS, SAMPLE_FIELDS } from "./defaults";

describe("invoice codec", () => {
  it("roundtrips EMPTY_FIELDS", () => {
    expect(deserialize(serialize(EMPTY_FIELDS))).toEqual(EMPTY_FIELDS);
  });

  it("roundtrips SAMPLE_FIELDS with nested items", () => {
    expect(deserialize(serialize(SAMPLE_FIELDS))).toEqual(SAMPLE_FIELDS);
  });

  it("rejects malformed payloads", () => {
    const junk = serialize({ ...EMPTY_FIELDS, title: 42 as unknown as string });
    expect(() => deserialize(junk)).toThrow(SchemaValidationError);
  });
});
