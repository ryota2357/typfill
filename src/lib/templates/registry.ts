import { resolve } from "$app/paths";
import * as invoice from "./invoice/index.ts";
import * as resume from "./resume/index.ts";
import * as soufujo from "./soufujo/index.ts";

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
    href: resolve("/resume"),
  },
  {
    templateId: invoice.templateId,
    label: invoice.label,
    sub: "Invoice",
    repo: "ryota2357/typst-invoice-template",
    enabled: true,
    href: resolve("/invoice"),
  },
  {
    templateId: soufujo.templateId,
    label: soufujo.label,
    sub: "Cover Letter",
    repo: "ryota2357/typst-soufujo-template",
    enabled: true,
    href: resolve("/soufujo"),
  },
] as const satisfies readonly CatalogEntry[];

export function listTemplates(): readonly CatalogEntry[] {
  return catalog;
}
