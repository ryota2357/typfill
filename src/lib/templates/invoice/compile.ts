import type { CompileInputs } from "#lib/typst/protocol.ts";
import { buildMainTyp } from "./codegen.ts";
import type { TemplateProps } from "./schema.ts";
import libTyp from "./template/lib.typ?raw";

// Static VFS entries that never change per-input. `main.typ` is generated per
// call and provided through `mainTyp` on `CompileInputs`.
const STATIC_SOURCES = { "/lib.typ": libTyp } as const;

export function buildCompileInputs(data: TemplateProps): CompileInputs {
  return {
    sources: STATIC_SOURCES,
    mainTyp: buildMainTyp(data),
  };
}
