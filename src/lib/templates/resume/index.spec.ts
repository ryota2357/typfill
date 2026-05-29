import { describe, expect, it } from "vitest";
import { deserialize, EMPTY_PROPS, SAMPLE_PROPS, serialize } from "./index";
import type { TemplateProps } from "./schema";

// Round-trips that exercise the UINT8ARRAY_CODEC wiring end-to-end. If a
// future refactor drops the codec from `valueCodecs`, the photo roundtrip
// below fails loudly (serialize throws `UnknownValueTypeError`).

describe("resume template codec", () => {
  it("roundtrips EMPTY_PROPS", () => {
    expect(deserialize(serialize(EMPTY_PROPS))).toEqual(EMPTY_PROPS);
  });

  it("roundtrips SAMPLE_PROPS with a Uint8Array photo", () => {
    const withPhoto: TemplateProps = {
      ...SAMPLE_PROPS,
      写真: {
        vfsPath: "/assets/photo.jpg",
        bytes: new Uint8Array([0, 128, 255, 1, 2, 3]),
      },
    };
    const back = deserialize(serialize(withPhoto));
    expect(back).toBeDefined();
    expect(back?.写真).not.toBeNull();
    expect(back?.写真?.vfsPath).toBe("/assets/photo.jpg");
    expect(back?.写真?.bytes).toBeInstanceOf(Uint8Array);
    expect(Array.from(back?.写真?.bytes ?? [])).toEqual([0, 128, 255, 1, 2, 3]);
    expect(back?.氏名).toEqual(SAMPLE_PROPS.氏名);
    expect(back?.学歴).toEqual(SAMPLE_PROPS.学歴);
  });

  it("strips the photo under sanitizeForShare", () => {
    const withPhoto: TemplateProps = {
      ...EMPTY_PROPS,
      写真: {
        vfsPath: "/assets/photo.jpg",
        bytes: new Uint8Array([9, 9, 9]),
      },
    };
    const back = deserialize(serialize(withPhoto, { for: "share" }));
    expect(back?.写真).toBeNull();
  });

  it("returns undefined for malformed payloads", () => {
    const mangled = serialize({
      ...EMPTY_PROPS,
      性別: 42 as unknown as string,
    });
    expect(deserialize(mangled)).toBeUndefined();
  });
});
