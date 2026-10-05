import type { Sentence } from "@/lib/types";

export function Captions({ sentences, index, active }: { sentences: Sentence[]; index: number; active: boolean }) {
  if (!sentences.length) {
    return <div className="well p-4 text-sm text-muted">Press play to hear the briefing. Captions will appear here.</div>;
  }
  return (
    <div className="well max-h-64 overflow-y-auto p-4 leading-8" aria-live="polite" aria-label="Captions">
      {sentences.map((s, i) => (
        <span key={i} className={`mr-1 rounded-md px-1 py-0.5 transition-colors ${active && i === index ? "bg-primary-soft font-semibold text-primary" : "text-ink-soft"}`}>{s.text}</span>
      ))}
    </div>
  );
}
