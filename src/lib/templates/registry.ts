import * as invoice from "./invoice";
import * as resume from "./resume";

// Thin catalog surfaced to the landing page. Each template namespace module
// exports `templateId` + `label`; the catalog adds presentation fields
// (`sub` English caption, upstream `repo`) plus an `enabled` flag (used to
// render "coming soon" slots without removing the entry entirely).

export type CatalogEntry = {
  templateId: string;
  label: string;
  sub: string;
  repo: string;
  enabled: boolean;
  href: string;
};

export const catalog = [
  {
    templateId: resume.templateId,
    label: resume.label,
    sub: "Resume",
    repo: "ryota2357/typst-resume-template",
    enabled: true,
    href: "/resume",
  },
  {
    templateId: invoice.templateId,
    label: invoice.label,
    sub: "Invoice",
    repo: "ryota2357/typst-invoice-template",
    enabled: true,
    href: "/invoice",
  },
] as const satisfies readonly CatalogEntry[];

export function listTemplates(): readonly CatalogEntry[] {
  return catalog;
}
