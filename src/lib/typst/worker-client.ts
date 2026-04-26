import {
  type CompileInputs,
  MAIN_TYP_PATH,
  type TypstDiagnostic,
  type TypstRequest,
  type TypstResponse,
} from "./protocol";
import TypstWorker from "./worker?worker";

type Pending = {
  resolve: (value: TypstResponse) => void;
  reject: (reason: Error) => void;
  detach: () => void;
};

// Thrown when the worker reports a failed compile/export. The diagnostics list
// from the failed job is preserved so the UI can still render `error`/`warning`
// entries even though there's no successful artifact.
export class TypstCompileError extends Error {
  diagnostics: TypstDiagnostic[];
  constructor(message: string, diagnostics: TypstDiagnostic[]) {
    super(message);
    this.name = "TypstCompileError";
    this.diagnostics = diagnostics;
  }
}

export type CompileResult = { svg: string; diagnostics: TypstDiagnostic[] };
export type ExportPdfResult = {
  pdf: Uint8Array;
  diagnostics: TypstDiagnostic[];
};

export type CompileOptions = {
  signal?: AbortSignal;
  timeoutMs?: number;
};

// The caller's `signal` aborts the returned promise. The underlying worker job
// still runs to completion (single-threaded WASM; no true interrupt), but its
// result is dropped once it arrives.
//
// `timeoutMs` is a hard deadline: once exceeded we terminate the worker to
// unblock the user. Typst WASM can't be interrupted mid-compile, so the only
// way to actually stop a runaway job (e.g. an infinite `#let` recursion in a
// malicious share URL) is to kill the worker process. A fresh worker is
// created lazily on the next request.
export type TypstClient = {
  compile(
    inputs: CompileInputs,
    options?: CompileOptions,
  ): Promise<CompileResult>;
  exportPdf(
    inputs: CompileInputs,
    options?: CompileOptions,
  ): Promise<ExportPdfResult>;
  dispose(): void;
};

// Defaults chosen to cover honest but slow compiles without letting pathological
// input (share URL DoS) freeze the browser tab.
const DEFAULT_COMPILE_TIMEOUT_MS = 10_000;
const DEFAULT_EXPORT_TIMEOUT_MS = 20_000;

function abortError(): Error {
  // DOMException is available in modern browsers and in Node ≥17.
  return new DOMException("Typst job aborted", "AbortError");
}

function timeoutError(ms: number): Error {
  return new DOMException(`Typst job exceeded ${ms}ms timeout`, "TimeoutError");
}

function mergeSources(inputs: CompileInputs) {
  return { ...inputs.sources, [MAIN_TYP_PATH]: inputs.mainTyp };
}

export function createTypstClient(): TypstClient {
  let worker: Worker | null = null;
  const pending = new Map<number, Pending>();
  let nextId = 0;
  let disposed = false;

  function handleMessage(e: MessageEvent<TypstResponse>) {
    const msg = e.data;
    const entry = pending.get(msg.id);
    if (!entry) return;
    pending.delete(msg.id);
    entry.detach();
    if (msg.ok) entry.resolve(msg);
    else entry.reject(new TypstCompileError(msg.error, msg.diagnostics));
  }

  function ensureWorker(): Worker {
    if (!worker) {
      worker = new TypstWorker();
      worker.addEventListener("message", handleMessage);
    }
    return worker;
  }

  // Kill the worker process and surface the reason to everything currently
  // pending. The next `send()` will lazily spin up a fresh worker — lazy
  // respawn avoids wasted boots when the user follows up with a fast edit
  // that the debounce will coalesce away.
  function terminateWithReason(reason: Error) {
    if (!worker) return;
    const toReject = [...pending.values()];
    pending.clear();
    worker.removeEventListener("message", handleMessage);
    worker.terminate();
    worker = null;
    for (const entry of toReject) {
      entry.detach();
      entry.reject(reason);
    }
  }

  function send(
    req: Omit<TypstRequest, "id">,
    timeoutMs: number,
    signal?: AbortSignal,
  ): Promise<TypstResponse> {
    if (disposed) return Promise.reject(new Error("TypstClient is disposed"));
    if (signal?.aborted) return Promise.reject(abortError());

    return new Promise((resolve, reject) => {
      const id = nextId++;
      const w = ensureWorker();

      let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

      const onAbort = () => {
        const entry = pending.get(id);
        if (!entry) return;
        pending.delete(id);
        entry.detach();
        reject(abortError());
      };
      const detach = () => {
        signal?.removeEventListener("abort", onAbort);
        if (timeoutHandle !== null) clearTimeout(timeoutHandle);
      };
      signal?.addEventListener("abort", onAbort, { once: true });

      timeoutHandle = setTimeout(() => {
        if (!pending.has(id)) return;
        // Rejections fan out via terminateWithReason so any other concurrent
        // job attached to this worker sees the same failure — the worker is
        // about to die anyway.
        terminateWithReason(timeoutError(timeoutMs));
      }, timeoutMs);

      pending.set(id, { resolve, reject, detach });
      w.postMessage({ ...req, id } as TypstRequest);
    });
  }

  return {
    async compile(inputs, options) {
      const res = await send(
        {
          type: "compile",
          sources: mergeSources(inputs),
          assets: inputs.assets,
        },
        options?.timeoutMs ?? DEFAULT_COMPILE_TIMEOUT_MS,
        options?.signal,
      );
      if (!res.ok || res.type !== "compile") {
        throw new Error(
          `unexpected response for compile: ${JSON.stringify(res)}`,
        );
      }
      return { svg: res.svg, diagnostics: res.diagnostics };
    },
    async exportPdf(inputs, options) {
      const res = await send(
        {
          type: "export-pdf",
          sources: mergeSources(inputs),
          assets: inputs.assets,
        },
        options?.timeoutMs ?? DEFAULT_EXPORT_TIMEOUT_MS,
        options?.signal,
      );
      if (!res.ok || res.type !== "export-pdf") {
        throw new Error(
          `unexpected response for export-pdf: ${JSON.stringify(res)}`,
        );
      }
      return { pdf: res.pdf, diagnostics: res.diagnostics };
    },
    dispose() {
      disposed = true;
      for (const entry of pending.values()) {
        entry.detach();
        entry.reject(new Error("TypstClient disposed before response"));
      }
      pending.clear();
      if (worker) {
        worker.removeEventListener("message", handleMessage);
        worker.terminate();
        worker = null;
      }
    },
  };
}
