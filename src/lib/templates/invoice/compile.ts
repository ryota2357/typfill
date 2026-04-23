import type { CompileInputs } from "$lib/typst/protocol";
import { buildMainTyp } from "./codegen";
import type { Fields } from "./schema";
import libTyp from "./template/lib.typ?raw";

// Static VFS entries that never change per-input. `main.typ` is generated per
// call and provided through `mainTyp` on `CompileInputs`.
const STATIC_SOURCES = { "/lib.typ": libTyp } as const;

export function buildCompileInputs(data: Fields): CompileInputs {
  return {
    sources: STATIC_SOURCES,
    mainTyp: buildMainTyp(data),
  };
}
