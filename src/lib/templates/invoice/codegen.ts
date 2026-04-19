import type { Fields } from "./schema";

// TODO(phase-5+): wire up invoice `lib.typ` and generate a real `main.typ`.
// Until the upstream template is copied into `./template/lib.typ`, this stub
// emits a minimal placeholder document so TemplateEditor's preview pane can
// render something instead of a compile error.
export function buildMainTyp(_data: Fields): string {
  return `#set page(width: 210mm, height: 297mm)\n= 請求書テンプレートは準備中です\n`;
}
