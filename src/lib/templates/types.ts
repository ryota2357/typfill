import type { Component } from "svelte";
import type { TypstAssets, TypstSources } from "$lib/typst/protocol";

// Combine a template's static sources with a freshly generated `main.typ`.
export function buildCompileSources<T>(
  module: TemplateModule<T>,
  data: T,
): TypstSources {
  return {
    ...module.sources,
    [module.mainPath]: module.buildMainTyp(data),
  };
}

// Resolve binary VFS entries referenced by the generated `.typ` (e.g. an
// uploaded resume photo). Returns `{}` for templates without binary inputs.
export function buildCompileAssets<T>(
  module: TemplateModule<T>,
  data: T,
): TypstAssets {
  return module.extractAssets ? module.extractAssets(data) : {};
}

// Everything the generic runtime needs to drive a template.
//
// `FormComponent` is nullable because templates may be registered before their
// Svelte form exists (e.g. Phase 1 wires up the resume codegen, Phase 2 adds
// the form). A `null` form paired with `enabled: false` marks a template that
// should not be selectable from the UI yet.
export type TemplateModule<T> = {
  id: string;
  label: string;
  enabled: boolean;
  defaults: T;
  sources: TypstSources;
  mainPath: string;
  buildMainTyp: (data: T) => string;
  // Optional: derive binary VFS entries (e.g. images) from the data. Templates
  // with text-only fields can omit this; the runtime treats it as `{}`.
  extractAssets?: (data: T) => TypstAssets;
  FormComponent: Component<{ data: T }> | null;
  // Strip fields that must never be included in a share-link payload
  // (e.g. photos, API tokens). See CONSEPT_AND_PLAN §1 "Persistence & sharing".
  sanitizeForShare: (data: T) => T;
};
