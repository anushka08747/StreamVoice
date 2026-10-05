import { Info } from "lucide-react";
import type { Insights } from "@/lib/insights/facts";

export function SourceLine({ insights: i }: { insights: Insights }) {
  const wait = i.pending ? ` ${i.pending} ${i.pending === 1 ? "entry is" : "entries are"} waiting for review.` : "";
  return (
    <p className="flex items-start gap-2 text-sm text-ink-soft">
      <Info size={16} className="mt-0.5 shrink-0 text-muted" aria-hidden />
      <span>Based on {i.current.n} observations from {i.current.observers} volunteers, {i.reviewed} reviewed.{wait} Confidence: <strong className="text-ink">{i.confidence}</strong>.</span>
    </p>
  );
}
