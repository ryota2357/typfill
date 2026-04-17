import type { TemplateModule } from "./types";
import { resumeModule } from "./resume/module";

// Invoice is not implemented until Phase 6 (CONSEPT_AND_PLAN §5 Phase 6+).
// An entry is present here so the landing page and routing can surface it as
// "coming soon" without restructuring the registry later.
type InvoiceDataStub = Record<string, never>;

const invoiceStub: TemplateModule<InvoiceDataStub> = {
  id: "invoice",
  label: "請求書",
  enabled: false,
  defaults: {},
  sources: {},
  mainPath: "/main.typ",
  buildMainTyp: () => {
    throw new Error(
      "Invoice template is not yet implemented (planned for Phase 6).",
    );
  },
  FormComponent: null,
  sanitizeForShare: (d) => d,
};

// Widened to `TemplateModule<unknown>` so the registry can hold modules with
// differing data types. Call sites that need the strong type should import
// the module directly (e.g. `resumeModule`).
export const templateRegistry: Record<string, TemplateModule<unknown>> = {
  resume: resumeModule as TemplateModule<unknown>,
  invoice: invoiceStub as TemplateModule<unknown>,
};

export function getTemplate(id: string): TemplateModule<unknown> | undefined {
  return templateRegistry[id];
}

export function listTemplates(): TemplateModule<unknown>[] {
  return Object.values(templateRegistry);
}
