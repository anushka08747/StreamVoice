"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BarChart3, CheckCircle2, CloudRain, Download, Plus, Trash2, Wind, Fish } from "lucide-react";
import { useInsights } from "@/lib/ui";
import { useApp } from "@/lib/store/AppContext";
import { Button, Card, Chip } from "@/components/ui";
import { HealthBadge } from "@/components/HealthBadge";
import { TrendArrow } from "@/components/TrendArrow";
import { Sparkline } from "@/components/Sparkline";
import { SourceLine } from "@/components/SourceLine";
import { OneHealthCard } from "@/components/OneHealthCard";
import { BriefingPlayer } from "@/components/BriefingPlayer";
import { RISK_LABELS } from "@/lib/insights/flags";
import { oneHealthFor } from "@/lib/narration/onehealth";
import { buildBundle } from "@/lib/fhir/bundle";

const RISK_ICON = { RUNOFF_SIGNAL: CloudRain, LITTER_RISING: Trash2, ODOR_REPORTED: Wind, LOW_BIODIVERSITY: Fish, LOW_DATA: BarChart3 };

export default function StreamPage() {
  const { id } = useParams<{ id: string }>();
  const insights = useInsights(id);
  const { observations } = useApp();
  if (!insights) return <Card>We could not find that stream. <Link href="/app" className="font-semibold text-primary">Back to the map</Link></Card>;

  const downloadFhir = () => {
    const blob = new Blob([JSON.stringify(buildBundle(insights.stream, observations), null, 2)], { type: "application/fhir+json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${insights.stream.id}-fhir-bundle.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const notes = oneHealthFor(insights, "adult");

  return (
    <>
      <Link href="/app" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-primary"><ArrowLeft size={16} aria-hidden />All streams</Link>
      <Card className="space-y-6">
        <div className="flex flex-wrap items-center gap-6">
          <HealthBadge score={insights.current.score} />
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl">{insights.stream.name}</h1>
            <p className="mt-1 text-ink-soft">{insights.stream.description}</p>
            <div className="mt-3"><TrendArrow trend={insights.trend} delta={insights.delta} /></div>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-6">
          <Sparkline points={[insights.previous.score, insights.current.score]} labels={["Last period", "This period"]} />
          <div className="min-w-0 flex-1">
            <p className="eyebrow mb-2">Risk signals</p>
            <ul className="flex flex-wrap gap-2" aria-label="Risk flags">
              {insights.risks.length === 0 && <li><Chip tone="good" icon={<CheckCircle2 size={14} />}>No risk flags</Chip></li>}
              {insights.risks.map((r) => { const I = RISK_ICON[r.code]; return <li key={r.code}><Chip tone={r.code === "LOW_DATA" ? "neutral" : "warn"} icon={<I size={14} />}>{RISK_LABELS[r.code]}</Chip></li>; })}
            </ul>
          </div>
        </div>
        <SourceLine insights={insights} />
      </Card>

      <BriefingPlayer insights={insights} />

      {notes.length > 0 && (
        <div className="space-y-4">
          <div>
            <p className="eyebrow">One Health</p>
            <h2 className="mt-1 text-2xl">Why this matters</h2>
          </div>
          {notes.map((n) => <OneHealthCard key={n.code} entry={n} />)}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <Link href={`/app/contribute?stream=${insights.stream.id}`} className="btn btn-primary"><Plus size={18} aria-hidden />Contribute an observation</Link>
        <Button variant="secondary" onClick={downloadFhir}><Download size={18} aria-hidden />FHIR bundle (JSON)</Button>
      </div>
    </>
  );
}
