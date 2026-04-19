import { ensure } from "@core/unknownutil";
import { makeCodec } from "../codec";
import { type Fields, isFields } from "./schema";

// Wire-format version. Bumped whenever `Fields` changes incompatibly so
// `deserialize` rejects envelopes from older payloads.
export const schemaVersion = 1;

// Invoice data is already JSON-safe (no Uint8Array, no classes), so `toWire`
// and `fromWire` are identities. The wire predicate equals the runtime one.
function validateWire(raw: unknown): Fields {
  return ensure(raw, isFields, { message: "請求書データの形式が不正です" });
}

export const { serialize, deserialize } = makeCodec<Fields, Fields>({
  schemaVersion,
  toWire: (data) => data,
  fromWire: (wire) => wire,
  validateWire,
});
