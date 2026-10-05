import type { Trend } from "../types";

export function trend(current: number | null, previous: number | null): { trend: Trend; delta: number | null } {
  if (current === null || previous === null) return { trend: "unknown", delta: null };
  const delta = current - previous;
  if (delta >= 8) return { trend: "improving", delta };
  if (delta <= -8) return { trend: "declining", delta };
  return { trend: "stable", delta };
}
