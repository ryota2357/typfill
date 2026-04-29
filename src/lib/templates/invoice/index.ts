// Public API for the invoice template. Consumers (`<TemplateEditor>`, routes)
// `import * as template from "$lib/templates/invoice"` and rely on the exports
// below; nothing else in this directory is considered public.

import { createCodec } from "../codec";
import { type Fields, isFields } from "./schema";

export const templateId = "invoice" as const;
export const label = "請求書";
export const storageKey = "typfill.invoice.v1";

export { buildCompileInputs } from "./compile";
export {
  EMPTY_FIELDS,
  nextMonthEnd,
  SAMPLE_FIELDS,
} from "./defaults";
export type { Fields, InvoiceItem, Party } from "./schema";

export const { serialize, deserialize, schemaVersion } = createCodec<Fields>({
  schemaVersion: 1,
  isFields,
});
