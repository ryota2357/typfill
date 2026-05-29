// Public API for the resume template. Consumers (`<TemplateEditor>`, routes)
// `import * as template from "$lib/templates/resume"` and rely on the exports
// below; nothing else in this directory is considered public.

import { createCodec, UINT8ARRAY_CODEC } from "../codec";
import { isTemplateProps, type TemplateProps } from "./schema";

export const templateId = "resume" as const;
export const label = "履歴書";
export const storageKey = "typfill.resume.v1";

export { buildCompileInputs } from "./compile";
export { EMPTY_PROPS, SAMPLE_PROPS } from "./defaults";
export type {
  Contact,
  Name,
  Photo,
  PlainDate,
  TemplateProps,
  TimelineEntry,
} from "./schema";

export const { serialize, deserialize, schemaVersion } =
  createCodec<TemplateProps>({
    schemaVersion: 1,
    isProps: isTemplateProps,
    valueCodecs: [UINT8ARRAY_CODEC],
    // Share payloads strip the photo unconditionally; photo-included sharing is
    // a future feature (CONSEPT_AND_PLAN §1).
    sanitizeForShare: (data) => ({ ...data, 写真: null }),
  });
