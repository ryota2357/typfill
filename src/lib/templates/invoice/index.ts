// Public API for the invoice template. Consumers (`<TemplateEditor>`, routes)
// `import * as template from "$lib/templates/invoice"` and rely on the exports
// below; nothing else in this directory is considered public.

export const templateId = "invoice" as const;
export const label = "請求書";
export const storageKey = "pdf-by-typst.invoice.v1";

export type { Fields, InvoiceItem, Party } from "./schema";
export { EMPTY_FIELDS, newInvoiceItem, SAMPLE_FIELDS } from "./defaults";
export { deserialize, schemaVersion, serialize } from "./codec";
export { buildCompileInputs } from "./compile";
