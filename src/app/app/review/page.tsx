"use client";
import { useState } from "react";
import { Bot, Check, CheckCircle2, ClipboardCheck, Pencil, RotateCcw, ShieldAlert, Target, X, XCircle } from "lucide-react";
import { useApp } from "@/lib/store/AppContext";
import { streams } from "@/lib/store/seed";
import type { Observation } from "@/lib/types";
import { Button, Card, Chip, Input, PageHeader, StatCard } from "@/components/ui";

const nameOf = (id: string) => streams.find((s) => s.id === id)?.name ?? id;

function Item({ o }: { o: Observation }) {
  const { updateObservation } = useApp();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ clarity: o.clarity, litter: o.litter, smell: o.smell, species: o.species.join(", ") });
  return (
    <li className="card space-y-4 border-l-4 !border-l-[var(--warn)] p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg">{nameOf(o.streamId)}</h2>
          <p className="text-sm text-muted">{o.observedAt}, volunteer {o.observerId}</p>
        </div>
        <Chip tone="warn" icon={<ShieldAlert size={13} />}>Needs review</Chip>
      </div>
      <ul className="space-y-2">
        {o.flags.map((f) => (
          <li key={f.code} className="flex items-start gap-2 rounded-xl bg-warn-soft px-4 py-2.5 text-sm text-[#7A4A06]">
            {f.source === "llm" ? <Bot size={16} className="mt-0.5 shrink-0" aria-label="AI note" /> : <ShieldAlert size={16} className="mt-0.5 shrink-0" aria-label="Rule check" />}
            {f.message}
          </li>
        ))}
      </ul>
      {!editing ? (
        <dl className="well grid grid-cols-2 gap-x-6 gap-y-3 p-4 text-sm sm:grid-cols-4">
          <div><dt className="text-muted">Clarity</dt><dd className="font-semibold">{o.clarity} of 5</dd></div>
          <div><dt className="text-muted">Smell</dt><dd className="font-semibold capitalize">{o.smell}</dd></div>
          <div><dt className="text-muted">Litter</dt><dd className="font-semibold">{o.litter} of 3</dd></div>
          <div><dt className="text-muted">Weather</dt><dd className="font-semibold capitalize">{o.weather.replace("_", " ")}</dd></div>
          <div className="col-span-full"><dt className="text-muted">Species</dt><dd className="font-semibold">{o.species.join(", ") || "none"}</dd></div>
          {o.notes && <div className="col-span-full"><dt className="text-muted">Notes</dt><dd className="font-semibold">{o.notes}</dd></div>}
        </dl>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold">Clarity (1 to 5)<Input className="mt-1" type="number" min={1} max={5} value={draft.clarity} onChange={(e) => setDraft({ ...draft, clarity: Math.min(5, Math.max(1, Number(e.target.value))) as Observation["clarity"] })} /></label>
          <label className="text-sm font-semibold">Litter (0 to 3)<Input className="mt-1" type="number" min={0} max={3} value={draft.litter} onChange={(e) => setDraft({ ...draft, litter: Math.min(3, Math.max(0, Number(e.target.value))) as Observation["litter"] })} /></label>
          <label className="text-sm font-semibold">Smell
            <select className="input mt-1" value={draft.smell} onChange={(e) => setDraft({ ...draft, smell: e.target.value as Observation["smell"] })}>
              {["none", "earthy", "sewage", "chemical", "other"].map((s) => <option key={s}>{s}</option>)}
            </select></label>
          <label className="text-sm font-semibold">Species (comma separated)<Input className="mt-1" value={draft.species} onChange={(e) => setDraft({ ...draft, species: e.target.value })} /></label>
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={() => updateObservation(o.id, { status: "confirmed" })}><Check size={16} className="text-good" aria-hidden />Confirm as recorded</Button>
        {!editing
          ? <Button size="sm" variant="secondary" onClick={() => setEditing(true)}><Pencil size={16} className="text-primary" aria-hidden />Correct</Button>
          : <Button size="sm" onClick={() => updateObservation(o.id, { status: "corrected", clarity: draft.clarity, litter: draft.litter, smell: draft.smell, species: draft.species.split(",").map((s) => s.trim()).filter(Boolean) })}><Check size={16} aria-hidden />Save correction</Button>}
        <Button size="sm" variant="ghost" onClick={() => updateObservation(o.id, { status: "rejected" })}><X size={16} className="text-bad" aria-hidden />Reject</Button>
      </div>
    </li>
  );
}

export default function ReviewPage() {
  const { observations, profile, setProfile, resetData } = useApp();
  const flagged = observations.filter((o) => o.status === "flagged");
  const count = (s: Observation["status"]) => observations.filter((o) => o.status === s).length;
  // "Confirmed as recorded" means the flag was a false alarm; corrected or rejected means it caught a real problem.
  const resolved = count("confirmed") + count("corrected") + count("rejected");
  const precision = resolved ? Math.round(((count("corrected") + count("rejected")) / resolved) * 100) : null;

  if (profile.role !== "reviewer") {
    return (
      <div className="mx-auto max-w-2xl">
        <PageHeader title="Review queue" />
        <Card large className="space-y-4 p-8">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary"><ClipboardCheck size={26} aria-hidden /></span>
          <p className="text-lg text-ink-soft">Switch to the Reviewer role to check flagged entries. {flagged.length} {flagged.length === 1 ? "entry is" : "entries are"} waiting.</p>
          <Button onClick={() => setProfile({ role: "reviewer" })}>Switch to Reviewer</Button>
        </Card>
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Review queue" subtitle="Flagged entries are excluded from scores and briefings until you confirm, correct, or reject them."
        action={<Button variant="ghost" size="sm" onClick={resetData}><RotateCcw size={16} aria-hidden />Reset sample data</Button>} />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
        <StatCard icon={<ShieldAlert size={16} />} label="Flagged" value={flagged.length} tone="warn" />
        <StatCard icon={<CheckCircle2 size={16} />} label="Confirmed" value={count("confirmed")} tone="good" />
        <StatCard icon={<Pencil size={16} />} label="Corrected" value={count("corrected")} />
        <StatCard icon={<XCircle size={16} />} label="Rejected" value={count("rejected")} tone="bad" />
        <StatCard icon={<Target size={16} />} label="Flag precision" value={precision === null ? "n/a" : `${precision}%`} tone="neutral" />
      </div>
      <p className="eyebrow mb-3 mt-10">Waiting for review ({flagged.length})</p>
      {flagged.length === 0
        ? <Card className="flex items-center gap-3 text-ink-soft"><CheckCircle2 className="text-good" aria-hidden />All caught up. Every flagged entry has been handled.</Card>
        : <ul className="space-y-4">{flagged.map((o) => <Item key={o.id} o={o} />)}</ul>}
    </div>
  );
}
