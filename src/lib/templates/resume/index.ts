// Public API for the resume template. Consumers (`<TemplateEditor>`, routes)
// `import * as template from "$lib/templates/resume"` and rely on the exports
// below; nothing else in this directory is considered public.

export const templateId = "resume" as const;
export const label = "履歴書";
export const storageKey = "pdf-by-typst.resume.v1";

export type { Contact, Fields, TimelineEntry } from "./schema";
export { EMPTY_FIELDS, newTimelineEntry, SAMPLE_FIELDS } from "./defaults";
export { deserialize, schemaVersion, serialize } from "./codec";
export { buildCompileInputs } from "./compile";
