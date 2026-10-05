"use client";
import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, Check, CheckCircle2, CloudDrizzle, CloudLightning, HelpCircle, Loader2, MessageCircleQuestion, Play, Sun } from "lucide-react";
import { useApp } from "@/lib/store/AppContext";
import { streams } from "@/lib/store/seed";
import { ANCHOR_DATE } from "@/lib/insights/score";
import { computeInsights } from "@/lib/insights/facts";
import type { Observation, Smell, Weather } from "@/lib/types";
import { Button, Card, Input, OptionPill, PageHeader, Textarea, cx } from "@/components/ui";

const SPECIES = ["mayfly nymph", "caddisfly larva", "stonefly nymph", "midge larva", "water strider", "dragonfly nymph", "crayfish", "minnow", "frog", "heron", "duck"];
const CLARITY_TEXT = ["", "Very murky: cannot see my feet", "Murky: can see a few centimeters", "Cloudy: can see the bed in shallow water", "Mostly clear", "Very clear: can see the bottom clearly"];
const SMELLS: { v: Smell; label: string }[] = [
  { v: "none", label: "No smell" }, { v: "earthy", label: "Earthy" }, { v: "sewage", label: "Sewage" }, { v: "chemical", label: "Chemical" }, { v: "other", label: "Other" },
];
const WEATHER: { v: Weather; label: string; icon: React.ReactNode }[] = [
  { v: "dry", label: "Dry", icon: <Sun size={15} /> }, { v: "light_rain", label: "Light rain", icon: <CloudDrizzle size={15} /> },
  { v: "heavy_rain", label: "Heavy rain", icon: <CloudLightning size={15} /> }, { v: "unknown", label: "Not sure", icon: <HelpCircle size={15} /> },
];
const LITTER = ["None", "A little", "Some", "A lot"];
const STEPS = ["Water", "Life and litter", "Notes and submit"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <fieldset><legend className="mb-3 font-semibold">{label}</legend>{children}</fieldset>;
}

function Form() {
  const params = useSearchParams();
  const { observations, addObservation, profile } = useApp();
  const [step, setStep] = useState(1);
  const [streamId, setStreamId] = useState(params.get("stream") ?? streams[0].id);
  const [date, setDate] = useState(ANCHOR_DATE);
  const [clarity, setClarity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [smell, setSmell] = useState<Smell>("none");
  const [species, setSpecies] = useState<string[]>([]);
  const [litter, setLitter] = useState<0 | 1 | 2 | 3>(0);
  const [weather, setWeather] = useState<Weather>("dry");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ obs: Observation; before: number | null; after: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const stream = useMemo(() => streams.find((s) => s.id === streamId)!, [streamId]);

  const submit = async () => {
    setBusy(true); setError(null);
    const draft: Observation = {
      id: `obs-${Date.now().toString(36)}`, streamId, observerId: profile.id, observedAt: date, clarity, smell, species, litter, weather,
      notes: notes.trim().slice(0, 500) || undefined, status: "accepted", flags: [],
    };
    const before = computeInsights(stream, observations).current.score;
    try {
      const res = await fetch("/api/validate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ observation: draft, history: observations.filter((o) => o.streamId === streamId) }) });
      if (!res.ok) throw new Error();
      const validated = (await res.json()) as Observation;
      addObservation(validated);
      const after = computeInsights(stream, [...observations, validated]).current.score;
      setResult({ obs: validated, before, after });
    } catch {
      setError("We could not save that just now. Please try again.");
    } finally { setBusy(false); }
  };

  if (result) {
    const flagged = result.obs.status === "flagged";
    return (
      <Card large className="space-y-5 p-8" role="status">
        <span className={cx("inline-flex h-14 w-14 items-center justify-center rounded-full", flagged ? "bg-warn-soft text-warn" : "bg-good-soft text-good")}>
          {flagged ? <MessageCircleQuestion size={26} aria-hidden /> : <CheckCircle2 size={26} aria-hidden />}
        </span>
        <h2 className="text-2xl">{flagged ? "We have a quick question about this entry" : "Thanks, added"}</h2>
        {flagged ? (
          <>
            <p className="text-ink-soft">A reviewer will take a look before it counts toward the score:</p>
            <ul className="space-y-2">{result.obs.flags.map((f) => <li key={f.code} className="rounded-xl bg-warn-soft px-4 py-2 text-sm text-[#7A4A06]">{f.message}</li>)}</ul>
          </>
        ) : (
          <p className="text-lg text-ink-soft">Your observation changed {stream.name}&apos;s score from <strong className="text-ink">{result.before ?? "unknown"}</strong> to <strong className="text-primary">{result.after ?? "unknown"}</strong>.</p>
        )}
        <div className="flex flex-wrap gap-3">
          <Link href={`/app/streams/${streamId}`} className="btn btn-primary"><Play size={18} aria-hidden />Play the updated briefing</Link>
          <Button variant="secondary" onClick={() => { setResult(null); setStep(1); setSpecies([]); setNotes(""); }}>Add another</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card large className="space-y-8 p-8">
      <ol className="flex flex-wrap gap-2" aria-label="Progress">
        {STEPS.map((s, i) => {
          const n = i + 1, done = n < step, cur = n === step;
          return (
            <li key={s} aria-current={cur ? "step" : undefined} className={cx("flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold",
              cur ? "bg-primary-soft text-primary" : done ? "text-good" : "text-muted")}>
              <span className={cx("inline-flex h-6 w-6 items-center justify-center rounded-full text-xs", cur ? "bg-primary text-white" : done ? "bg-good-soft" : "bg-bg-2")}>{done ? <Check size={14} /> : n}</span>
              {s}
            </li>
          );
        })}
      </ol>

      {step === 1 && (
        <div className="space-y-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block"><span className="mb-2 block font-semibold">Stream</span>
              <select className="input" value={streamId} onChange={(e) => setStreamId(e.target.value)}>{streams.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            </label>
            <label className="block"><span className="mb-2 block font-semibold">Date of visit</span><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
          </div>
          <label className="block"><span className="mb-3 block font-semibold">Water clarity</span>
            <input type="range" min={1} max={5} step={1} value={clarity} className="range" onChange={(e) => setClarity(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)} aria-valuetext={CLARITY_TEXT[clarity]} />
            <span className="mt-3 flex items-center gap-3 text-sm"><span className="chip bg-primary-soft text-primary">{clarity} of 5</span><span className="text-ink-soft">{CLARITY_TEXT[clarity]}</span></span>
          </label>
          <Field label="Smell">
            <div className="flex flex-wrap gap-2">{SMELLS.map((s) => <OptionPill key={s.v} selected={smell === s.v} onClick={() => setSmell(s.v)}>{s.label}</OptionPill>)}</div>
          </Field>
        </div>
      )}
      {step === 2 && (
        <div className="space-y-7">
          <Field label="Species you spotted">
            <div className="flex flex-wrap gap-2">{SPECIES.map((s) => { const on = species.includes(s); return <OptionPill key={s} selected={on} icon={on ? <Check size={14} /> : undefined} onClick={() => setSpecies(on ? species.filter((x) => x !== s) : [...species, s])}>{s}</OptionPill>; })}</div>
          </Field>
          <Field label="Litter">
            <div className="flex flex-wrap gap-2">{LITTER.map((l, i) => <OptionPill key={l} selected={litter === i} onClick={() => setLitter(i as 0 | 1 | 2 | 3)}>{l}</OptionPill>)}</div>
          </Field>
          <Field label="Weather">
            <div className="flex flex-wrap gap-2">{WEATHER.map((w) => <OptionPill key={w.v} selected={weather === w.v} icon={w.icon} onClick={() => setWeather(w.v)}>{w.label}</OptionPill>)}</div>
          </Field>
        </div>
      )}
      {step === 3 && (
        <div className="space-y-5">
          <label className="block"><span className="mb-2 block font-semibold">Notes <span className="font-normal text-muted">(optional)</span></span>
            <Textarea rows={4} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="For example: water looked brown after the storm" />
          </label>
          <div className="well space-y-1 p-4 text-sm text-ink-soft">
            <p className="font-semibold text-ink">{stream.name}, {date}</p>
            <p>Clarity {clarity} of 5, smell {smell}, litter {LITTER[litter].toLowerCase()}, weather {weather.replace("_", " ")}</p>
            <p>Species: {species.length ? species.join(", ") : "none picked"}</p>
          </div>
          {error && <p role="alert" className="flex items-center gap-2 rounded-xl bg-bad-soft p-3 text-sm font-medium text-[#B8352E]"><AlertTriangle size={16} aria-hidden />{error}</p>}
        </div>
      )}
      <div className="flex justify-between border-t border-[var(--line)] pt-6">
        <Button variant="ghost" disabled={step === 1} onClick={() => setStep(step - 1)}><ArrowLeft size={18} aria-hidden />Back</Button>
        {step < 3
          ? <Button onClick={() => setStep(step + 1)}>Continue<ArrowRight size={18} aria-hidden /></Button>
          : <Button onClick={submit} disabled={busy}>{busy ? <><Loader2 size={18} className="animate-spin" aria-hidden />Checking</> : <>Submit observation<ArrowRight size={18} aria-hidden /></>}</Button>}
      </div>
    </Card>
  );
}

export default function ContributePage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Contribute" subtitle="Record what you saw at the stream. It takes about a minute, and quick checks run as soon as you submit." />
      <Suspense fallback={<div className="well h-64 animate-pulse" />}><Form /></Suspense>
    </div>
  );
}
