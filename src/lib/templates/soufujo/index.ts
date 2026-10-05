// Public API for the soufujo (送付状) template. Consumers (`<TemplateEditor>`,
// routes) `import * as template from "#lib/templates/soufujo/index.ts"` and
// rely on the exports below; nothing else in this directory is considered
// public.

import { createCodec } from "../codec.ts";
import { isTemplateProps, type TemplateProps } from "./schema.ts";

export const templateId = "soufujo" as const;
export const label = "送付状";
export const storageKey = "typfill.soufujo.v1";

export { buildCompileInputs } from "./compile.ts";
export { EMPTY_PROPS, SAMPLE_PROPS } from "./defaults.ts";
export type {
  Enclosure,
  PlainDate,
  Recipient,
  Sender,
  TemplateProps,
} from "./schema.ts";

export const { serialize, deserialize, schemaVersion } =
  createCodec<TemplateProps>({
    schemaVersion: 1,
    isProps: isTemplateProps,
  });
