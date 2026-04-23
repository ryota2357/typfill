import { is } from "@core/unknownutil";
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { describe, expect, it, vi } from "vitest";
import {
  createCodec,
  ReservedKeyError,
  UINT8ARRAY_CODEC,
  UnknownValueTypeError,
  type ValueCodec,
} from "./codec";

// A permissive predicate that accepts any non-undefined value. Useful when the
// test focuses on the walker itself rather than on domain validation.
const isAny = (x: unknown): x is unknown => x !== undefined;

describe("createCodec — JSON-native roundtrips", () => {
  const codec = createCodec({ schemaVersion: 1, isFields: isAny });

  it("roundtrips primitives, null, and booleans", () => {
    const data = {
      n: 42,
      s: "hello",
      b: true,
      nul: null,
      zero: 0,
      empty: "",
    };
    expect(codec.deserialize(codec.serialize(data))).toEqual(data);
  });

  it("roundtrips arrays including nested arrays", () => {
    const data = { xs: [1, 2, [3, [4, 5]]], ss: ["a", "b"] };
    expect(codec.deserialize(codec.serialize(data))).toEqual(data);
  });

  it("roundtrips deeply-nested plain objects", () => {
    const data = {
      a: { b: { c: { d: { e: "bottom" } } } },
      list: [{ k: 1 }, { k: 2, nested: { x: [true, false] } }],
    };
    expect(codec.deserialize(codec.serialize(data))).toEqual(data);
  });
});

describe("createCodec — ValueCodec (Uint8Array)", () => {
  const codec = createCodec({
    schemaVersion: 1,
    isFields: isAny,
    valueCodecs: [UINT8ARRAY_CODEC],
  });

  it("roundtrips top-level Uint8Array values", () => {
    const data = { bytes: new Uint8Array([0, 1, 2, 3, 255]) };
    const back = codec.deserialize(codec.serialize(data)) as {
      bytes: Uint8Array;
    };
    expect(back.bytes).toBeInstanceOf(Uint8Array);
    expect(Array.from(back.bytes)).toEqual([0, 1, 2, 3, 255]);
  });

  it("roundtrips Uint8Array nested inside plain objects and arrays", () => {
    const data = {
      outer: {
        list: [
          { bytes: new Uint8Array([1]) },
          { bytes: new Uint8Array([2, 3]) },
        ],
      },
    };
    const back = codec.deserialize(codec.serialize(data)) as typeof data;
    expect(back.outer.list).toHaveLength(2);
    const [first, second] = back.outer.list;
    expect(Array.from(first?.bytes ?? [])).toEqual([1]);
    expect(Array.from(second?.bytes ?? [])).toEqual([2, 3]);
  });

  it("serialize throws UnknownValueTypeError when a ValueCodec is missing", () => {
    const codecWithoutBytes = createCodec({
      schemaVersion: 1,
      isFields: isAny,
    });
    expect(() =>
      codecWithoutBytes.serialize({ bytes: new Uint8Array([1]) }),
    ).toThrow(UnknownValueTypeError);
  });
});

describe("createCodec — reserved key policy", () => {
  const codec = createCodec({ schemaVersion: 1, isFields: isAny });

  it("throws ReservedKeyError when user data contains __c", () => {
    expect(() => codec.serialize({ __c: "evil" })).toThrow(ReservedKeyError);
    expect(() => codec.serialize({ nested: { __c: "evil" } })).toThrow(
      ReservedKeyError,
    );
  });
});

describe("createCodec — deserialize failure modes (return undefined)", () => {
  const codec = createCodec({
    schemaVersion: 1,
    isFields: is.ObjectOf({ n: is.Number }),
  });

  it("returns undefined for un-decompressable payloads", () => {
    expect(codec.deserialize("@@@invalid@@@")).toBeUndefined();
  });

  it("returns undefined for non-JSON bodies", () => {
    const payload = compressToEncodedURIComponent("not json");
    expect(codec.deserialize(payload)).toBeUndefined();
  });

  it("returns undefined for non-envelope bodies", () => {
    const payload = compressToEncodedURIComponent(JSON.stringify({ foo: 1 }));
    expect(codec.deserialize(payload)).toBeUndefined();
  });

  it("returns undefined on schema version mismatch", () => {
    const bad = { version: 99, data: { n: 1 } };
    const payload = compressToEncodedURIComponent(JSON.stringify(bad));
    expect(codec.deserialize(payload)).toBeUndefined();
  });

  it("returns undefined when isFields rejects the decoded value", () => {
    const bad = { version: 1, data: { n: "not-a-number" } };
    const payload = compressToEncodedURIComponent(JSON.stringify(bad));
    expect(codec.deserialize(payload)).toBeUndefined();
  });

  it("returns undefined for unknown value codec tags", () => {
    const bad = { version: 1, data: { n: { __c: "UnknownType", v: 1 } } };
    const payload = compressToEncodedURIComponent(JSON.stringify(bad));
    expect(codec.deserialize(payload)).toBeUndefined();
  });

  it("returns undefined when a value codec's decode fails", () => {
    const codecWithBytes = createCodec({
      schemaVersion: 1,
      isFields: isAny,
      valueCodecs: [UINT8ARRAY_CODEC],
    });
    const bad = {
      version: 1,
      data: { bytes: { __c: "Uint8Array", v: 12345 } },
    };
    const payload = compressToEncodedURIComponent(JSON.stringify(bad));
    expect(codecWithBytes.deserialize(payload)).toBeUndefined();
  });
});

describe("createCodec — sanitizeForShare", () => {
  it("applies sanitizeForShare only when for: share", () => {
    const sanitize = vi.fn((d: { secret: string }) => ({ ...d, secret: "" }));
    const codec = createCodec({
      schemaVersion: 1,
      isFields: is.ObjectOf({ secret: is.String }),
      sanitizeForShare: sanitize,
    });
    const data = { secret: "top" };

    const storageBack = codec.deserialize(codec.serialize(data));
    expect(storageBack?.secret).toBe("top");
    expect(sanitize).not.toHaveBeenCalled();

    const shareBack = codec.deserialize(
      codec.serialize(data, { for: "share" }),
    );
    expect(shareBack?.secret).toBe("");
    expect(sanitize).toHaveBeenCalledOnce();
  });
});

describe("createCodec — envelope format", () => {
  it("emits { version, data } with the declared version", () => {
    const codec = createCodec({ schemaVersion: 7, isFields: isAny });
    const payload = codec.serialize({ n: 1 });
    const json = decompressFromEncodedURIComponent(payload);
    const envelope = JSON.parse(json as string);
    expect(envelope.version).toBe(7);
    expect(envelope.data).toEqual({ n: 1 });
  });
});

describe("createCodec — custom ValueCodec", () => {
  interface Point {
    x: number;
    y: number;
  }
  const POINT_CODEC: ValueCodec<Point> = {
    tag: "Point",
    is: (x): x is Point =>
      typeof x === "object" &&
      x !== null &&
      x.constructor !== Object &&
      "x" in x &&
      "y" in x,
    encode: (p) => [p.x, p.y],
    decode: (w): Point | undefined => {
      if (!Array.isArray(w) || w.length !== 2) return undefined;
      const [x, y] = w;
      if (typeof x !== "number" || typeof y !== "number") return undefined;
      return Object.assign(Object.create(null) as object, { x, y }) as Point;
    },
  };

  it("routes non-plain-object runtime values through valueCodecs by tag", () => {
    const codec = createCodec({
      schemaVersion: 1,
      isFields: isAny,
      valueCodecs: [POINT_CODEC],
    });
    const p = Object.assign(Object.create(null) as object, { x: 1, y: 2 });
    const back = codec.deserialize(codec.serialize({ p })) as { p: Point };
    expect(back.p.x).toBe(1);
    expect(back.p.y).toBe(2);
  });
});
