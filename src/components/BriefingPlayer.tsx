"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BriefingResponse, Level, Minutes } from "@/lib/types";
import type { Insights } from "@/lib/insights/facts";
import { useApp } from "@/lib/store/AppContext";
import { BrowserTts, browserTtsSupported } from "@/lib/tts/browser";
import { ServerTts } from "@/lib/tts/server";
import type { TtsProvider } from "@/lib/tts/provider";
import { AlertTriangle, Captions as CaptionsIcon, Loader2, Pause, Play, RefreshCw, SkipBack, SkipForward, Sparkles, FileText, Mic, Smartphone } from "lucide-react";
import { Button, Card, Chip, Segmented } from "./ui";
import { Captions } from "./Captions";

const CACHE_PREFIX = "streamvoice.briefing.v1.";

function hash(s: string) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}

export function BriefingPlayer({ insights }: { insights: Insights }) {
  const { observations, setProfile } = useApp();
  const [level, setLevel] = useState<Level>("adult");
  const [minutes, setMinutes] = useState<Minutes>(2);
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [captions, setCaptions] = useState(true);
  const [rate, setRate] = useState(1);
  const [voice, setVoice] = useState<string>("");
  const provider = useRef<TtsProvider | null>(null);

  const streamObs = useMemo(() => observations.filter((o) => o.streamId === insights.stream.id), [observations, insights.stream.id]);
  const key = useMemo(() => CACHE_PREFIX + hash(JSON.stringify(insights.facts) + level + minutes), [insights.facts, level, minutes]);

  const stop = useCallback(() => { provider.current?.stop(); provider.current = null; setPlaying(false); setStarted(false); setIdx(0); }, []);

  // Changing stream, level, length or data invalidates the current briefing.
  useEffect(() => { stop(); setBriefing(null); setError(null); }, [key, stop]);
  useEffect(() => stop, [stop]);

  const load = useCallback(async (force = false): Promise<BriefingResponse | null> => {
    if (!force) {
      try {
        const c = localStorage.getItem(key);
        if (c) { const b = JSON.parse(c) as BriefingResponse; setBriefing(b); return b; }
      } catch { /* ignore */ }
    }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/briefing", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ streamId: insights.stream.id, observations: streamObs, level, minutes }),
      });
      if (!res.ok) throw new Error("bad response");
      const b = (await res.json()) as BriefingResponse;
      setBriefing(b);
      try { localStorage.setItem(key, JSON.stringify(b)); } catch { /* ignore */ }
      return b;
    } catch {
      setError("We could not build the briefing just now. Please try again.");
      return null;
    } finally { setLoading(false); }
  }, [key, insights.stream.id, streamObs, level, minutes]);

  const startFrom = useCallback((b: BriefingResponse, from: number, useServer: boolean) => {
    provider.current?.stop();
    const serverDown = (() => { try { return sessionStorage.getItem("sv.ttsDown") === "1"; } catch { return false; } })();
    const p: TtsProvider = useServer && !serverDown ? new ServerTts(level) : new BrowserTts();
    if (!(p instanceof ServerTts) && !browserTtsSupported()) { setError("This browser cannot speak aloud, but you can read the captions."); return; }
    p.setRate(rate);
    provider.current = p;
    setVoice(p.label);
    setPlaying(true); setStarted(true);
    p.speak(b.script, {
      onSentenceStart: setIdx,
      onEnd: () => { setPlaying(false); setStarted(false); setProfile({ heardFull: true }); },
      onError: (i) => {
        if (p instanceof ServerTts) { try { sessionStorage.setItem("sv.ttsDown", "1"); } catch { /* ignore */ } startFrom(b, i, false); }
        else { setPlaying(false); setError("Voice playback failed. Captions are still available."); }
      },
    }, from);
  }, [level, rate, setProfile]);

  const onPlayPause = useCallback(async () => {
    if (started && provider.current) {
      if (playing) { provider.current.pause(); setPlaying(false); } else { provider.current.resume(); setPlaying(true); }
      return;
    }
    const b = briefing ?? (await load());
    if (b) startFrom(b, 0, true);
  }, [started, playing, briefing, load, startFrom]);

  const skip = useCallback((d: number) => {
    if (!briefing) return;
    const n = Math.min(briefing.script.length - 1, Math.max(0, idx + d));
    setIdx(n);
    if (started) startFrom(briefing, n, provider.current instanceof ServerTts);
  }, [briefing, idx, started, startFrom]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || e.metaKey || e.ctrlKey) return;
      if (e.key === " " && t.tagName !== "BUTTON") { e.preventDefault(); onPlayPause(); }
      else if (e.key === "ArrowRight") skip(1);
      else if (e.key === "ArrowLeft") skip(-1);
      else if (e.key.toLowerCase() === "c") setCaptions((c) => !c);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onPlayPause, skip]);

  const changeRate = (r: number) => { setRate(r); provider.current?.setRate(r); };
  const pct = briefing ? Math.round(((idx + (started ? 1 : 0)) / briefing.script.length) * 100) : 0;

  const regenerate = async () => { stop(); try { sessionStorage.removeItem("sv.ttsDown"); } catch { /* ignore */ } await load(true); };

  return (
    <Card large className="space-y-6" aria-label="Spoken briefing">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Briefing</p>
          <h2 className="mt-1 text-2xl">Listen to {insights.stream.name}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {briefing && (briefing.source === "ai"
            ? <Chip tone="primary" icon={<Sparkles size={13} />}>AI-narrated, verified</Chip>
            : <Chip tone="neutral" icon={<FileText size={13} />}>Template-narrated</Chip>)}
          {voice && <Chip tone="neutral" icon={voice === "AI voice" ? <Mic size={13} /> : <Smartphone size={13} />}>{voice}</Chip>}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Segmented<Level> label="Listener level" value={level} onChange={setLevel}
          options={[{ value: "child", label: "Child" }, { value: "adult", label: "Adult" }, { value: "scientist", label: "Scientist" }]} />
        <Segmented<Minutes> label="Length" value={minutes} onChange={setMinutes}
          options={[{ value: 1, label: "1 min" }, { value: 2, label: "2 min" }, { value: 3, label: "3 min" }]} />
      </div>

      <div className="flex items-center gap-4">
        <button type="button" onClick={onPlayPause} disabled={loading}
          aria-label={playing ? "Pause briefing" : "Play briefing"}
          className="btn btn-primary h-16 w-16 shrink-0 !rounded-full !p-0">
          {loading ? <Loader2 size={26} className="animate-spin" aria-hidden /> : playing ? <Pause size={26} aria-hidden /> : <Play size={26} className="ml-1" aria-hidden />}
        </button>
        <div className="min-w-0 flex-1">
          <div role="progressbar" aria-label="Briefing progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} className="h-2 overflow-hidden rounded-full bg-bg-2">
            <div className="h-full rounded-full" style={{ width: `${pct}%`, transition: "width 200ms", background: "linear-gradient(90deg, var(--primary-2), var(--primary))" }} />
          </div>
          <p className="mt-2 text-xs text-muted">
            {loading ? "Building a verified script..." : briefing ? `Sentence ${Math.min(idx + 1, briefing.script.length)} of ${briefing.script.length}, ${briefing.wordCount} words` : "Press play to generate and hear the briefing"}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="secondary" size="sm" onClick={() => skip(-1)} disabled={!briefing} aria-label="Previous sentence"><SkipBack size={16} aria-hidden /></Button>
        <Button variant="secondary" size="sm" onClick={() => skip(1)} disabled={!briefing} aria-label="Next sentence"><SkipForward size={16} aria-hidden /></Button>
        <Segmented<number> label="Speed" value={rate} onChange={changeRate}
          options={[{ value: 0.8, label: "0.8x" }, { value: 1, label: "1x" }, { value: 1.3, label: "1.3x" }]} />
        <Button variant="secondary" size="sm" aria-pressed={captions} onClick={() => setCaptions(!captions)}>
          <CaptionsIcon size={16} aria-hidden />Captions {captions ? "on" : "off"}
        </Button>
        <Button variant="ghost" size="sm" onClick={regenerate} disabled={loading}><RefreshCw size={16} aria-hidden />Regenerate</Button>
      </div>

      {error && <p role="alert" className="flex items-center gap-2 rounded-xl bg-bad-soft p-3 text-sm font-medium text-[#B8352E]"><AlertTriangle size={16} aria-hidden />{error}</p>}
      {captions && <Captions sentences={briefing?.script ?? []} index={idx} active={started} />}
      <p className="text-xs text-muted">Keyboard: space to play or pause, arrow keys to skip a sentence, c for captions.</p>
    </Card>
  );
}
