import { maybe } from "@core/unknownutil";
import lzString from "lz-string";
import { base64ToBytes, bytesToBase64 } from "$lib/base64";

// lz-string ships as CommonJS; named imports fail under Vite SSR. Destructure
// from the default export so the landing page can load the registry chain
// without blowing up the SSR evaluator.
const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } =
  lzString;

// Shared codec layer for template data.
//
// Each template supplies a single `isFields` predicate (ドメイン述語) plus
// optional `ValueCodec`s for types that JSON can't represent natively
// (`Uint8Array`, `Date`, …). `createCodec` walks the value tree automatically;
// no template-specific `toWire`/`fromWire` or wire-shape predicate is needed.

// Envelope key used to tag wire values produced by a `ValueCodec`. Using a
// double-underscore prefix keeps it out of the way of realistic domain keys.
// The tree walker refuses to serialize plain objects that literally contain
// this key (see `ReservedKeyError`).
const TAG = "__c";

export interface ValueCodec<T> {
  /** Wire tag. Must be globally unique; we use the constructor name. */
  tag: string;
  /** Runtime predicate — does this codec handle the given value? */
  is: (x: unknown) => x is T;
  /** runtime → JSON-safe representation. */
  encode: (value: T) => unknown;
  /** JSON-safe → runtime. Return `undefined` when the wire is malformed. */
  decode: (wire: unknown) => T | undefined;
}

// Heterogeneous collections of `ValueCodec<T>` can't be typed as
// `ValueCodec<unknown>[]` — `encode: (value: T) => unknown` is contravariant in
// `T`, so `ValueCodec<Uint8Array>` isn't assignable to `ValueCodec<unknown>`.
// `any` is the standard escape hatch for this variance pattern; the walker
// only calls `is(x)` (which narrows) before `encode(x)`, so the `any` stays
// contained.
// biome-ignore lint/suspicious/noExplicitAny: see above.
type AnyValueCodec = ValueCodec<any>;

export const UINT8ARRAY_CODEC: ValueCodec<Uint8Array> = {
  tag: "Uint8Array",
  is: (x): x is Uint8Array => x instanceof Uint8Array,
  encode: (u) => bytesToBase64(u),
  decode: (w) => (typeof w === "string" ? base64ToBytes(w) : undefined),
};

export class ReservedKeyError extends Error {
  constructor(path: string) {
    super(
      `reserved key "${TAG}" encountered at ${path}; domain fields must not use this key`,
    );
    this.name = "ReservedKeyError";
  }
}

export class UnknownValueTypeError extends Error {
  constructor(path: string, value: unknown) {
    const typeName =
      value === null
        ? "null"
        : typeof value === "object"
          ? (Object.getPrototypeOf(value)?.constructor?.name ?? "object")
          : typeof value;
    super(
      `no ValueCodec registered for value at ${path} (runtime type: ${typeName})`,
    );
    this.name = "UnknownValueTypeError";
  }
}

export type SerializeOptions = {
  /** "share" triggers `sanitizeForShare`; "storage" (default) keeps all fields. */
  for?: "share" | "storage";
};

export interface CodecSpec<T> {
  schemaVersion: number;
  isFields: (x: unknown) => x is T;
  valueCodecs?: readonly AnyValueCodec[];
  sanitizeForShare?: (data: T) => T;
}

export interface Codec<T> {
  schemaVersion: number;
  serialize: (data: T, options?: SerializeOptions) => string;
  /** Returns `undefined` when the payload is malformed or from an old version. */
  deserialize: (payload: string) => T | undefined;
}

type Envelope = { version: number; data: unknown };

function isEnvelope(x: unknown): x is Envelope {
  return (
    typeof x === "object" &&
    x !== null &&
    "version" in x &&
    "data" in x &&
    typeof (x as { version: unknown }).version === "number"
  );
}

function isPlainObject(x: unknown): x is Record<string, unknown> {
  if (typeof x !== "object" || x === null) return false;
  const proto = Object.getPrototypeOf(x);
  return proto === Object.prototype || proto === null;
}

// Sentinel for decode failures that has to thread back up the tree. Using a
// unique object reference avoids collisions with legitimate decoded values
// (including `undefined`, which would otherwise be ambiguous with "valid
// optional absence"). Internal only.
const DECODE_FAIL = Symbol("DECODE_FAIL");
type DecodeFail = typeof DECODE_FAIL;

function encodeTree(
  value: unknown,
  codecs: readonly AnyValueCodec[],
  path: string,
): unknown {
  if (value === null) return null;
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return value;
  if (Array.isArray(value)) {
    return value.map((v, i) => encodeTree(v, codecs, `${path}[${i}]`));
  }
  if (isPlainObject(value)) {
    if (TAG in value) throw new ReservedKeyError(path);
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      out[k] = encodeTree(v, codecs, `${path}.${k}`);
    }
    return out;
  }
  for (const codec of codecs) {
    if (codec.is(value)) {
      return { [TAG]: codec.tag, v: codec.encode(value) };
    }
  }
  throw new UnknownValueTypeError(path, value);
}

function decodeTree(
  value: unknown,
  codecsByTag: Map<string, AnyValueCodec>,
): unknown | DecodeFail {
  if (value === null) return null;
  const t = typeof value;
  if (t === "string" || t === "number" || t === "boolean") return value;
  if (Array.isArray(value)) {
    const out: unknown[] = [];
    for (const v of value) {
      const decoded = decodeTree(v, codecsByTag);
      if (decoded === DECODE_FAIL) return DECODE_FAIL;
      out.push(decoded);
    }
    return out;
  }
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (TAG in obj) {
      const tag = obj[TAG];
      if (typeof tag !== "string") return DECODE_FAIL;
      const codec = codecsByTag.get(tag);
      if (!codec) return DECODE_FAIL;
      const decoded = codec.decode(obj.v);
      return decoded === undefined ? DECODE_FAIL : decoded;
    }
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      const decoded = decodeTree(v, codecsByTag);
      if (decoded === DECODE_FAIL) return DECODE_FAIL;
      out[k] = decoded;
    }
    return out;
  }
  return DECODE_FAIL;
}

export function createCodec<T>(spec: CodecSpec<T>): Codec<T> {
  const codecs = spec.valueCodecs ?? [];
  const codecsByTag = new Map<string, AnyValueCodec>();
  for (const c of codecs) codecsByTag.set(c.tag, c);

  return {
    schemaVersion: spec.schemaVersion,
    serialize(data, options) {
      const source =
        options?.for === "share" && spec.sanitizeForShare
          ? spec.sanitizeForShare(data)
          : data;
      const envelope: Envelope = {
        version: spec.schemaVersion,
        data: encodeTree(source, codecs, "$"),
      };
      return compressToEncodedURIComponent(JSON.stringify(envelope));
    },
    deserialize(payload) {
      const json = decompressFromEncodedURIComponent(payload);
      if (!json) return undefined;

      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch {
        return undefined;
      }

      const envelope = maybe(parsed, isEnvelope);
      if (!envelope) return undefined;
      if (envelope.version !== spec.schemaVersion) return undefined;

      const decoded = decodeTree(envelope.data, codecsByTag);
      if (decoded === DECODE_FAIL) return undefined;

      return maybe(decoded, spec.isFields);
    },
  };
}
