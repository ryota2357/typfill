import { ensure } from "@core/unknownutil";
import { base64ToBytes, bytesToBase64 } from "$lib/base64";
import { makeCodec } from "../codec";
import { type Fields, type FieldsWire, isFieldsWire } from "./schema";

// Wire-format version. Bumped whenever `FieldsWire` changes incompatibly so
// `deserialize` rejects envelopes from older payloads.
export const schemaVersion = 1;

function toWire(data: Fields): FieldsWire {
  return {
    ...data,
    写真: data.写真
      ? {
          vfsPath: data.写真.vfsPath,
          bytesBase64: bytesToBase64(data.写真.bytes),
        }
      : null,
  };
}

function fromWire(wire: FieldsWire): Fields {
  return {
    ...wire,
    写真: wire.写真
      ? {
          vfsPath: wire.写真.vfsPath,
          bytes: base64ToBytes(wire.写真.bytesBase64),
        }
      : null,
  };
}

function validateWire(raw: unknown): FieldsWire {
  return ensure(raw, isFieldsWire, { message: "履歴書データの形式が不正です" });
}

// Share payloads currently strip the photo unconditionally; photo-included
// sharing is a future feature (CONSEPT_AND_PLAN §1).
function sanitizeForShare(data: Fields): Fields {
  return { ...data, 写真: null };
}

export const { serialize, deserialize } = makeCodec<Fields, FieldsWire>({
  schemaVersion,
  toWire,
  fromWire,
  validateWire,
  sanitizeForShare,
});
