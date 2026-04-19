// Shared types and pure utilities for the form primitives in this directory.
// Importable from any template's route-level composition.

export type DateRecord = { year: number; month: number; day: number };

export type TimelineField<E> = {
  key: keyof E & string;
  label: string;
  type: "number" | "text";
  width: string;
  min?: number;
  max?: number;
};

// In-place reorder. Out-of-range from/to is a no-op so callers can naively
// pass i±1 without bounds-checking.
export function moveItem<T>(list: T[], from: number, to: number): void {
  if (from < 0 || from >= list.length) return;
  if (to < 0 || to >= list.length) return;
  const [item] = list.splice(from, 1);
  list.splice(to, 0, item);
}
