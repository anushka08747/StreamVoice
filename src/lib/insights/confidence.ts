import type { Confidence } from "../types";

export function confidence(n: number, observers: number, unresolvedFlags: number): Confidence {
  if (n < 3 || unresolvedFlags > 0) return "Low";
  if (n >= 6 && observers >= 2) return "High";
  return "Medium";
}
