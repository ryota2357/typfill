// Public API for the soufujo (送付状) template. Consumers (`<TemplateEditor>`,
// routes) `import * as template from "$lib/templates/soufujo"` and rely on the
// exports below; nothing else in this directory is considered public.

import { createCodec } from "../codec";
import { isTemplateProps, type TemplateProps } from "./schema";

export const templateId = "soufujo" as const;
export const label = "送付状";
export const storageKey = "typfill.soufujo.v1";

export { buildCompileInputs } from "./compile";
export { EMPTY_PROPS, SAMPLE_PROPS } from "./defaults";
export type {
  Enclosure,
  PlainDate,
  Recipient,
  Sender,
  TemplateProps,
} from "./schema";

export const { serialize, deserialize, schemaVersion } =
  createCodec<TemplateProps>({
    schemaVersion: 1,
    isProps: isTemplateProps,
  });
