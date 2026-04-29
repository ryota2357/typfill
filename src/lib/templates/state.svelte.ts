// Lifecycle for a single template's editor state. Both routes share four
// concerns — load from localStorage, accept/reject share-URL imports, and
// reset back to a "fresh" snapshot — and previously each route reimplemented
// the same 30-line dance. This factory bundles them so the page becomes a
// view over `state` rather than a state machine itself.
//
// The autosave `$effect` and URL-fragment detection stay in TemplateEditor —
// they need a component context (`$effect`, `onMount`), which this hook
// can't provide.

type TemplateRef<T> = {
  storageKey: string;
  deserialize: (payload: string) => T | undefined;
};

export interface TemplateState<T> {
  /**
   * Live form data. Readers see the current proxy; writers replace it with
   * a new object (used by `acceptImport`/`reset`). Field-level mutations
   * propagate through Svelte's deep proxy without going through the setter.
   */
  data: T;
  /** Pending share-URL payload awaiting user confirmation, or null. */
  readonly importPayload: T | null;
  /** Human-readable failure message from the last `onImport`, or "". */
  readonly importError: string;
  /** True when `localStorage` already has saved data for this template. */
  readonly hasStoredData: boolean;
  /** Decode a share-URL payload; populates `importPayload` or `importError`. */
  onImport(payload: string): void;
  /** Apply the pending import to `data` and dismiss the dialog. */
  acceptImport(): void;
  /** Discard the pending import without touching `data`. */
  cancelImport(): void;
  /** Reset `data` to a fresh snapshot and drop the localStorage entry. */
  reset(): void;
}

export function createTemplateState<T>(
  template: TemplateRef<T>,
  fresh: () => T,
): TemplateState<T> {
  function loadInitial(): T {
    if (typeof localStorage === "undefined") return fresh();
    const raw = localStorage.getItem(template.storageKey);
    if (!raw) return fresh();
    return template.deserialize(raw) ?? fresh();
  }

  let data = $state<T>(loadInitial());
  let importPayload = $state<T | null>(null);
  let importError = $state("");

  // Returning getter/setters (rather than `{ data }`) is required: a plain
  // shorthand would capture `data`'s value at construction time, and
  // assignments through the returned object would never reach the rune.
  return {
    get data() {
      return data;
    },
    set data(v: T) {
      data = v;
    },
    get importPayload() {
      return importPayload;
    },
    get importError() {
      return importError;
    },
    get hasStoredData() {
      if (typeof localStorage === "undefined") return false;
      return localStorage.getItem(template.storageKey) !== null;
    },
    onImport(payload) {
      const next = template.deserialize(payload);
      if (next) importPayload = next;
      else importError = "共有リンクを読み込めませんでした";
    },
    acceptImport() {
      if (importPayload) data = importPayload;
      importPayload = null;
    },
    cancelImport() {
      importPayload = null;
    },
    reset() {
      data = fresh();
      try {
        localStorage.removeItem(template.storageKey);
      } catch {
        // localStorage can throw (private mode, quota, disabled storage).
        // The user's intent — wipe the form — is still satisfied by the
        // in-memory reset; the next autosave attempt will surface any
        // persistent failure via TemplateEditor's status indicator.
      }
    },
  };
}
