import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from "lz-string";
import { describe, expect, it, vi } from "vitest";
import {
  makeCodec,
  SchemaValidationError,
  SchemaVersionMismatchError,
} from "./codec";

type Runtime = { n: number; bytes: Uint8Array; secret: string };
type Wire = { n: number; bytesLen: number; secret: string };

function isWire(raw: unknown): raw is Wire {
  if (typeof raw !== "object" || raw === null) return false;
  const o = raw as Record<string, unknown>;
  return (
    typeof o.n === "number" &&
    typeof o.bytesLen === "number" &&
    typeof o.secret === "string"
  );
}

function validateWire(raw: unknown): Wire {
  if (!isWire(raw)) throw new Error("invalid wire");
  return raw;
}

const spec = {
  schemaVersion: 1,
  toWire: (d: Runtime): Wire => ({
    n: d.n,
    bytesLen: d.bytes.length,
    secret: d.secret,
  }),
  fromWire: (w: Wire): Runtime => ({
    n: w.n,
    bytes: new Uint8Array(w.bytesLen),
    secret: w.secret,
  }),
  validateWire,
};

describe("makeCodec", () => {
  it("roundtrips data through serialize/deserialize", () => {
    const codec = makeCodec(spec);
    const data: Runtime = {
      n: 7,
      bytes: new Uint8Array([1, 2, 3, 4, 5]),
      secret: "hello",
    };
    const payload = codec.serialize(data);
    const back = codec.deserialize(payload);
    expect(back.n).toBe(7);
    expect(back.bytes.length).toBe(5);
    expect(back.secret).toBe("hello");
  });

  it("throws SchemaVersionMismatchError when envelope version differs", () => {
    const codec = makeCodec(spec);
    const badEnvelope = { version: 99, data: { n: 1, bytesLen: 0, secret: "" } };
    const payload = compressToEncodedURIComponent(JSON.stringify(badEnvelope));
    expect(() => codec.deserialize(payload)).toThrow(SchemaVersionMismatchError);
  });

  it("throws SchemaValidationError when wire shape is wrong", () => {
    const codec = makeCodec(spec);
    const badEnvelope = { version: 1, data: { n: "not-a-number" } };
    const payload = compressToEncodedURIComponent(JSON.stringify(badEnvelope));
    expect(() => codec.deserialize(payload)).toThrow(SchemaValidationError);
  });

  it("throws SchemaValidationError for un-decompressable payloads", () => {
    const codec = makeCodec(spec);
    expect(() => codec.deserialize("@@@invalid@@@")).toThrow(
      SchemaValidationError,
    );
  });

  it("throws SchemaValidationError for non-JSON body", () => {
    const codec = makeCodec(spec);
    const payload = compressToEncodedURIComponent("not json");
    expect(() => codec.deserialize(payload)).toThrow(SchemaValidationError);
  });

  it("throws SchemaValidationError for non-envelope bodies", () => {
    const codec = makeCodec(spec);
    const payload = compressToEncodedURIComponent(JSON.stringify({ foo: 1 }));
    expect(() => codec.deserialize(payload)).toThrow(SchemaValidationError);
  });

  it("applies sanitizeForShare only when for: share", () => {
    const sanitize = vi.fn((d: Runtime): Runtime => ({ ...d, secret: "" }));
    const codec = makeCodec({ ...spec, sanitizeForShare: sanitize });
    const data: Runtime = {
      n: 1,
      bytes: new Uint8Array(),
      secret: "top-secret",
    };

    const storagePayload = codec.serialize(data);
    const storageBack = codec.deserialize(storagePayload);
    expect(storageBack.secret).toBe("top-secret");
    expect(sanitize).not.toHaveBeenCalled();

    const sharePayload = codec.serialize(data, { for: "share" });
    const shareBack = codec.deserialize(sharePayload);
    expect(shareBack.secret).toBe("");
    expect(sanitize).toHaveBeenCalledOnce();
  });

  it("serialize output is decompress-able and carries the declared version", () => {
    const codec = makeCodec(spec);
    const data: Runtime = {
      n: 42,
      bytes: new Uint8Array(),
      secret: "s",
    };
    const payload = codec.serialize(data);
    const json = decompressFromEncodedURIComponent(payload);
    expect(json).not.toBe("");
    const envelope = JSON.parse(json as string);
    expect(envelope.version).toBe(1);
    expect(envelope.data.n).toBe(42);
  });
});
