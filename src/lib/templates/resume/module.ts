import type { TypstAssets } from "$lib/typst/protocol";
import type { TemplateModule } from "../types";
import { buildMainTyp } from "./codegen";
import { RESUME_EMPTY_DATA } from "./defaults";
import libTyp from "./template/lib.typ?raw";
import type { ResumeData } from "./types";
import ResumeForm from "./ui/ResumeForm.svelte";

// Strip fields that must never leak into a share link.
// §1 of CONSEPT_AND_PLAN excludes photos from the default share payload.
function sanitizeForShare(data: ResumeData): ResumeData {
  return { ...data, 写真: null };
}

function extractAssets(data: ResumeData): TypstAssets {
  if (!data.写真) return {};
  return { [data.写真.vfsPath]: data.写真.bytes };
}

export const resumeModule: TemplateModule<ResumeData> = {
  id: "resume",
  label: "履歴書",
  enabled: true,
  defaults: RESUME_EMPTY_DATA,
  sources: { "/lib.typ": libTyp },
  mainPath: "/main.typ",
  buildMainTyp,
  extractAssets,
  FormComponent: ResumeForm,
  sanitizeForShare,
};
