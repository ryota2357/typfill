import lzString from "lz-string";

// lz-string ships as CommonJS; named imports fail under Vite SSR. Destructure
// from the default export so the landing page can load the registry chain
// without blowing up the SSR evaluator.
const { compressToEncodedURIComponent, decompressFromEncodedURIComponent } =
  lzString;

// Shared codec combinator for template data layers.
//
// Each template supplies a `toWire`/`fromWire` pair (runtime type ↔ JSON-safe
// wire type) and a `validateWire` predicate. `makeCodec` turns that into a
// `{ serialize, deserialize }` pair that handles versioning, lz-string
// compression, and optional share-time sanitization uniformly.

export type SerializeOptions = {
  // "storage" = persist locally (keep all fields; default).
  // "share"   = prepare for URL fragment (apply `sanitizeForShare` first).
  for?: "share" | "storage";
};

export type Envelope<W> = { version: number; data: W };

export class SchemaVersionMismatchError extends Error {
  readonly expected: number;
  readonly actual: unknown;
  constructor(expected: number, actual: unknown) {
    super(`schema version mismatch: expected ${expected}, got ${String(actual)}`);
    this.name = "SchemaVersionMismatchError";
    this.expected = expected;
    this.actual = actual;
  }
}

export class SchemaValidationError extends Error {
  readonly cause?: unknown;
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "SchemaValidationError";
    this.cause = cause;
  }
}

export type CodecSpec<T, W> = {
  schemaVersion: number;
  toWire(data: T): W;
  fromWire(wire: W): T;
  // Should throw (typically via `@core/unknownutil` `ensure`) when the raw
  // parsed JSON does not match the wire shape.
  validateWire(raw: unknown): W;
  // Optional: strip fields from the runtime value before serialization when
  // `for: "share"` is requested (e.g. remove photo bytes from share links).
  sanitizeForShare?(data: T): T;
};

export type Codec<T> = {
  serialize(data: T, options?: SerializeOptions): string;
  deserialize(payload: string): T;
};

export function makeCodec<T, W>(spec: CodecSpec<T, W>): Codec<T> {
  return {
    serialize(data, options) {
      const source =
        options?.for === "share" && spec.sanitizeForShare
          ? spec.sanitizeForShare(data)
          : data;
      const envelope: Envelope<W> = {
        version: spec.schemaVersion,
        data: spec.toWire(source),
      };
      return compressToEncodedURIComponent(JSON.stringify(envelope));
    },
    deserialize(payload) {
      const json = decompressFromEncodedURIComponent(payload);
      if (!json) {
        throw new SchemaValidationError("failed to decompress payload");
      }
      let parsed: unknown;
      try {
        parsed = JSON.parse(json);
      } catch (cause) {
        throw new SchemaValidationError("payload is not valid JSON", cause);
      }
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !("version" in parsed) ||
        !("data" in parsed)
      ) {
        throw new SchemaValidationError("payload is not a versioned envelope");
      }
      const { version, data } = parsed as { version: unknown; data: unknown };
      if (version !== spec.schemaVersion) {
        throw new SchemaVersionMismatchError(spec.schemaVersion, version);
      }
      let wire: W;
      try {
        wire = spec.validateWire(data);
      } catch (cause) {
        throw new SchemaValidationError(
          cause instanceof Error ? cause.message : String(cause),
          cause,
        );
      }
      return spec.fromWire(wire);
    },
  };
}
