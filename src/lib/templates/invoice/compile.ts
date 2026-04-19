import type { CompileInputs } from "$lib/typst/protocol";
import { buildMainTyp } from "./codegen";
import type { Fields } from "./schema";

// TODO(phase-5+): once `./template/lib.typ` exists, load it with `?raw` and
// include it under `/lib.typ` like resume does. Current stub codegen produces
// a self-contained main.typ, so no static sources are needed yet.
const STATIC_SOURCES = {} as const;

export function buildCompileInputs(data: Fields): CompileInputs {
  return {
    sources: STATIC_SOURCES,
    mainTyp: buildMainTyp(data),
  };
}
