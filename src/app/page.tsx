import Link from "next/link";
import {
  ArrowRight, AudioLines, BadgeCheck, Calculator, CheckCircle2, ClipboardCheck, Droplets, FileJson, HeartPulse,
  Mic, ShieldCheck, Sparkles, UserCheck, Waves,
} from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { computeInsights } from "@/lib/insights/facts";
import { seedObservations, streams, SAMPLE_DATA_LABEL } from "@/lib/store/seed";
import { RISK_LABELS } from "@/lib/insights/flags";

const demo = computeInsights(streams[0], seedObservations);

const FEATURES = [
  { icon: AudioLines, tone: "bg-primary-soft text-primary", title: "Spoken briefings", body: "A one to three minute audio summary of each stream, with live captions, for children, adults, or scientists." },
  { icon: ShieldCheck, tone: "bg-[#E4F3F2] text-teal", title: "Numbers you can trust", body: "Code computes every statistic. The AI only narrates, and a verifier rejects any sentence it cannot trace back to the data." },
  { icon: UserCheck, tone: "bg-warn-soft text-warn", title: "Human review", body: "Suspicious entries are flagged and held back until a reviewer confirms, corrects, or rejects them." },
  { icon: HeartPulse, tone: "bg-good-soft text-good", title: "One Health context", body: "Every finding explains what it can mean for people, pets, wildlife, and the wider environment." },
];

const STEPS = [
  { n: "01", title: "Volunteers observe", body: "Record clarity, smell, species, litter, and weather in a one minute guided form. Rule checks catch contradictions right away." },
  { n: "02", title: "Code computes, AI narrates", body: "A transparent health score, trend, and risk flags are calculated in code. Gemini turns those facts into a short, verified script." },
  { n: "03", title: "Listen and act", body: "Press play on any stream, see what changed, and learn how to help. New observations update the score and the next briefing." },
];

function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgba(241,243,253,0.85)] backdrop-blur">
      <nav aria-label="Main" className="mx-auto flex max-w-[1280px] items-center justify-between px-4 py-3 md:px-8">
        <Link href="/" className="flex items-center gap-3 text-xl font-bold">
          <LogoMark size={40} />
          StreamVoice
          <span className="chip bg-primary-soft text-primary">Beta</span>
        </Link>
        <div className="flex items-center gap-2 md:gap-6">
          <a href="#features" className="hidden text-ink-soft hover:text-primary md:inline">Features</a>
          <a href="#how" className="hidden text-ink-soft hover:text-primary md:inline">How it works</a>
          <Link href="/app" className="btn btn-primary">Open the map <ArrowRight size={18} aria-hidden /></Link>
        </div>
      </nav>
    </header>
  );
}

function HeroMock() {
  const rows = [
    { icon: Calculator, tone: "bg-primary-soft text-primary", title: "Insights", sub: `Health score ${demo.current.score}, trend ${demo.trend}` },
    { icon: ClipboardCheck, tone: "bg-warn-soft text-warn", title: "Validation", sub: `${demo.pending} entry held for review` },
    { icon: BadgeCheck, tone: "bg-[#E4F3F2] text-teal", title: "Narration", sub: "Every number verified against the facts" },
    { icon: HeartPulse, tone: "bg-good-soft text-good", title: "One Health", sub: demo.risks.map((r) => RISK_LABELS[r.code]).slice(0, 2).join(", ") || "No risks raised" },
    { icon: Mic, tone: "bg-primary-soft text-primary", title: "Voice", sub: "AI voice ready, device voice as backup" },
  ];
  return (
    <div className="card card-lg overflow-hidden p-0" aria-hidden>
      <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4">
        <span className="h-3 w-3 rounded-full bg-[#F28B82]" /><span className="h-3 w-3 rounded-full bg-[#F7C948]" /><span className="h-3 w-3 rounded-full bg-[#6FCF97]" />
        <span className="ml-3 flex-1 truncate rounded-full bg-bg px-4 py-1.5 font-mono text-xs text-muted">streamvoice.app/app/streams/berrys-creek</span>
      </div>
      <div className="flex items-center gap-4 border-b border-[var(--line)] px-6 py-5">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary"><Waves size={20} /></span>
        <div className="min-w-0 flex-1">
          <p className="font-bold">Berrys Creek briefing</p>
          <p className="text-sm text-muted">{demo.current.n} observations from {demo.current.observers} volunteers</p>
        </div>
        <span className="chip bg-bad-soft text-[#B8352E]">Score {demo.current.score}, {demo.trend}</span>
      </div>
      <div className="px-6 py-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="eyebrow">Briefing pipeline</span>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-good"><span className="pulse-dot h-2 w-2 rounded-full bg-good" />5/5 complete</span>
        </div>
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.title} className="flex items-center gap-4 rounded-2xl bg-bg px-4 py-3 shadow-[inset_0_1px_0_#fff]">
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${r.tone}`}><r.icon size={18} /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{r.title}</p>
                <p className="truncate text-sm text-ink-soft">{r.sub}</p>
              </div>
              <CheckCircle2 size={22} className="text-good" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <>
      <Nav />
      <main id="main">
        <section className="mx-auto grid max-w-[1280px] items-center gap-14 px-4 pb-24 pt-16 md:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-24">
          <div>
            <span className="card inline-flex items-center gap-2 !rounded-full px-4 py-2 text-sm text-ink-soft">
              <span className="h-2 w-2 rounded-full bg-good" /> Citizen science, explained in plain language
            </span>
            <h1 className="mt-8 text-5xl leading-[1.05] md:text-7xl">
              Your stream,<br /><span className="text-gradient">explained out loud.</span>
            </h1>
            <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink-soft md:text-xl">
              StreamVoice turns volunteer observations about urban streams into a short spoken briefing: what changed, what it may signal, and why it matters for people, pets, and wildlife.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/app" className="btn btn-primary !min-h-[56px] !px-8 text-lg">Open the map <ArrowRight size={20} aria-hidden /></Link>
              <Link href="/app/streams/berrys-creek" className="btn btn-secondary !min-h-[56px] !px-8 text-lg">Hear a sample briefing</Link>
            </div>
          </div>
          <HeroMock />
        </section>

        <section id="features" className="scroll-mt-24 mx-auto max-w-[1280px] px-4 py-24 md:px-8">
          <div className="text-center">
            <p className="eyebrow">Features</p>
            <h2 className="mt-3 text-4xl md:text-5xl">From observation to understanding</h2>
            <p className="mt-4 text-lg text-ink-soft">Every step from a volunteer&apos;s visit to a spoken briefing, with people in the loop.</p>
          </div>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="card hover-lift p-7">
                <span aria-hidden className={`inline-flex h-14 w-14 items-center justify-center rounded-full ${f.tone}`}><f.icon size={24} /></span>
                <h3 className="mt-6 text-xl">{f.title}</h3>
                <p className="mt-3 leading-relaxed text-ink-soft">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="scroll-mt-24 mx-auto max-w-[1280px] px-4 py-24 md:px-8">
          <div className="text-center">
            <p className="eyebrow">How it works</p>
            <h2 className="mt-3 text-4xl md:text-5xl">From the stream bank to your ears</h2>
          </div>
          <div className="mt-14 grid gap-6 lg:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="card flex gap-6 p-8">
                <span className="text-5xl font-bold leading-none text-[#C3C7FA]" aria-hidden>{s.n}</span>
                <div>
                  <h3 className="text-xl">{s.title}</h3>
                  <p className="mt-3 leading-relaxed text-ink-soft">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              { icon: Droplets, label: "3 sample streams", sub: "Declining, stable, and improving stories" },
              { icon: Sparkles, label: "Gemini narration and voice", sub: "With a template and device voice fallback" },
              { icon: FileJson, label: "FHIR R4 export", sub: "Observation bundles for health data systems" },
            ].map((x) => (
              <div key={x.label} className="flex items-center gap-4 rounded-2xl px-2 py-2">
                <span aria-hidden className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary"><x.icon size={20} /></span>
                <div><p className="font-semibold">{x.label}</p><p className="text-sm text-ink-soft">{x.sub}</p></div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1280px] px-4 py-16 md:px-8">
          <div className="card card-lg flex flex-col items-center px-6 py-20 text-center" style={{ background: "linear-gradient(180deg, #F5F6FF 0%, #E7EAFD 100%)" }}>
            <LogoMark size={80} />
            <h2 className="mt-8 text-4xl md:text-5xl">Ready to hear your stream?</h2>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">Pick a stream on the map, press play, and add your own observation next time you visit.</p>
            <Link href="/app" className="btn btn-primary mt-10 !min-h-[56px] !px-10 text-lg">Open the map <ArrowRight size={20} aria-hidden /></Link>
          </div>
        </section>
      </main>
      <footer className="mt-10 border-t border-[var(--line)]">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-4 py-8 text-muted md:px-8">
          <p className="flex items-center gap-2"><AudioLines size={18} className="text-primary" aria-hidden /> StreamVoice: stream health briefings</p>
          <p className="text-sm">{SAMPLE_DATA_LABEL}</p>
          <div className="flex gap-6">
            <Link href="/app" className="hover:text-primary">Map</Link>
            <Link href="/app/contribute" className="hover:text-primary">Contribute</Link>
            <Link href="/app/review" className="hover:text-primary">Review</Link>
          </div>
        </div>
      </footer>
    </>
  );
}
