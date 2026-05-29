// Public API for the invoice template. Consumers (`<TemplateEditor>`, routes)
// `import * as template from "$lib/templates/invoice"` and rely on the exports
// below; nothing else in this directory is considered public.

import { createCodec } from "../codec";
import { isTemplateProps, type TemplateProps } from "./schema";

export const templateId = "invoice" as const;
export const label = "請求書";
export const storageKey = "typfill.invoice.v1";

export { buildCompileInputs } from "./compile";
export { EMPTY_PROPS, nextMonthEnd, SAMPLE_PROPS } from "./defaults";
export type {
  Account,
  InvoiceItem,
  Party,
  PlainDate,
  TemplateProps,
} from "./schema";

export const { serialize, deserialize, schemaVersion } =
  createCodec<TemplateProps>({
    schemaVersion: 1,
    isProps: isTemplateProps,
  });
