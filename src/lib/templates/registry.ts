import * as invoice from "./invoice";
import * as resume from "./resume";

// Thin catalog surfaced to the landing page. Each template namespace module
// exports `templateId` + `label`; the catalog just pairs those with a routing
// `href` and an `enabled` flag (used to render "coming soon" slots without
// removing the entry entirely).

export type CatalogEntry = {
  templateId: string;
  label: string;
  enabled: boolean;
  href: string;
};

export const catalog = [
  {
    templateId: resume.templateId,
    label: resume.label,
    enabled: true,
    href: "/resume",
  },
  {
    templateId: invoice.templateId,
    label: invoice.label,
    enabled: true,
    href: "/invoice",
  },
] as const satisfies readonly CatalogEntry[];

export function listTemplates(): readonly CatalogEntry[] {
  return catalog;
}
