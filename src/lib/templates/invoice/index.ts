// Public API for the invoice template. Consumers (`<TemplateEditor>`, routes)
// `import * as template from "#lib/templates/invoice/index.ts"` and rely on
// the exports below; nothing else in this directory is considered public.

import { createCodec } from "../codec.ts";
import { isTemplateProps, type TemplateProps } from "./schema.ts";

export const templateId = "invoice" as const;
export const label = "請求書";
export const storageKey = "typfill.invoice.v1";

export { buildCompileInputs } from "./compile.ts";
export { EMPTY_PROPS, nextMonthEnd, SAMPLE_PROPS } from "./defaults.ts";
export type {
  Account,
  InvoiceItem,
  Party,
  PlainDate,
  TemplateProps,
} from "./schema.ts";

export const { serialize, deserialize, schemaVersion } =
  createCodec<TemplateProps>({
    schemaVersion: 1,
    isProps: isTemplateProps,
  });
