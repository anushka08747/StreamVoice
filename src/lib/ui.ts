import { useMemo } from "react";
import { useApp } from "./store/AppContext";
import { computeInsights, type Insights } from "./insights/facts";
import { streams } from "./store/seed";

export type Band = "good" | "warn" | "bad" | "unknown";

export function healthBand(score: number | null): Band {
  if (score === null) return "unknown";
  return score >= 65 ? "good" : score >= 45 ? "warn" : "bad";
}

export const BAND_COLOR: Record<Band, string> = {
  good: "#1E9E63", warn: "#D98A1C", bad: "#E0524A", unknown: "#9AA0C3",
};
export const BAND_LABEL: Record<Band, string> = { good: "Healthy", warn: "Needs attention", bad: "Concerning", unknown: "Not enough data" };
export const BAND_TONE = { good: "good", warn: "warn", bad: "bad", unknown: "neutral" } as const;

export function useAllInsights(): Insights[] {
  const { observations } = useApp();
  return useMemo(() => streams.map((s) => computeInsights(s, observations)), [observations]);
}

export function useInsights(streamId: string): Insights | null {
  const all = useAllInsights();
  return all.find((i) => i.stream.id === streamId) ?? null;
}
