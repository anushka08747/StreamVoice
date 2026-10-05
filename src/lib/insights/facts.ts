import type { Fact, Observation, Stream, Trend, Confidence, RiskCode } from "../types";
import { ANCHOR_DATE, periods, counted, metrics, inPeriod, type PeriodMetrics, type Period } from "./score";
import { trend } from "./trends";
import { riskFlags, RISK_LABELS, type RiskResult } from "./flags";
import { confidence } from "./confidence";

export type Insights = {
  stream: Stream;
  periods: { current: Period; previous: Period };
  current: PeriodMetrics;
  previous: PeriodMetrics;
  trend: Trend;
  delta: number | null;
  risks: RiskResult[];
  confidence: Confidence;
  reviewed: number;
  pending: number;
  facts: Fact[];
};

const RISK_TEXT: Record<RiskCode, string> = {
  RUNOFF_SIGNAL: "Clarity dropped and fewer species were seen, which can signal runoff pollution.",
  LITTER_RISING: "Litter reports went up compared with last period.",
  ODOR_REPORTED: "At least one sewage or chemical smell was reported this period.",
  LOW_BIODIVERSITY: "Only a few kinds of species were seen this period.",
  LOW_DATA: "There are few observations this period, so this picture is uncertain.",
};

export function computeInsights(stream: Stream, all: Observation[], anchor: string = ANCHOR_DATE): Insights {
  const obs = all.filter((o) => o.streamId === stream.id);
  const per = periods(anchor);
  const cur = counted(obs, per.current);
  const prev = counted(obs, per.previous);
  const cm = metrics(cur);
  const pm = metrics(prev);
  const t = trend(cm.score, pm.score);
  const risks = riskFlags(cur, prev);
  const inCur = obs.filter((o) => inPeriod(o, per.current));
  const pending = inCur.filter((o) => o.status === "flagged").length;
  const reviewed = inCur.filter((o) => o.status === "confirmed" || o.status === "corrected").length;
  const conf = confidence(cm.n, cm.observers, pending);

  const facts: Fact[] = [];
  const add = (kind: Fact["kind"], text: string, values: Fact["values"], src: string[]) =>
    facts.push({ id: `F${facts.length + 1}`, kind, text, values, sourceObservationIds: src });
  const curIds = cur.map((o) => o.id);
  const bothIds = [...prev, ...cur].map((o) => o.id);

  add("count", `${cm.n} observations from ${cm.observers} volunteers were counted for ${stream.name} this period.`,
    { observations: cm.n, volunteers: cm.observers }, curIds);
  add("period", `This period runs from ${per.current.start} to ${per.current.end}. The previous period ran from ${per.previous.start} to ${per.previous.end}.`,
    { start: per.current.start, end: per.current.end, previousStart: per.previous.start, previousEnd: per.previous.end }, []);
  if (cm.score !== null) {
    add("score", `The health score is ${cm.score} out of 100.` + (pm.score !== null ? ` Last period it was ${pm.score}.` : ""),
      pm.score !== null ? { score: cm.score, previousScore: pm.score } : { score: cm.score }, bothIds);
  }
  if (t.trend !== "unknown" && t.delta !== null) {
    add("trend", `The trend is ${t.trend}, a change of ${t.delta > 0 ? "+" : ""}${t.delta} points.`, { trend: t.trend, delta: t.delta }, bothIds);
  }
  if (cm.n && pm.n) {
    if (cm.clarity !== pm.clarity)
      add("trend", `Average water clarity went from ${pm.clarity} to ${cm.clarity} on a 1 to 5 scale.`, { previousClarity: pm.clarity, clarity: cm.clarity }, bothIds);
    if (cm.species !== pm.species)
      add("trend", `Distinct species seen went from ${pm.species} to ${cm.species}.`, { previousSpecies: pm.species, species: cm.species }, bothIds);
    if (cm.litter !== pm.litter)
      add("trend", `Average litter went from ${pm.litter} to ${cm.litter} on a 0 to 3 scale.`, { previousLitter: pm.litter, litter: cm.litter }, bothIds);
  }
  for (const r of risks) add("risk", RISK_TEXT[r.code], { code: r.code, label: RISK_LABELS[r.code] }, r.sourceObservationIds);
  add("count", `Confidence is ${conf}. ${reviewed} entries were reviewed and ${pending} are waiting for review.`,
    { confidence: conf, reviewed, pending }, curIds);

  return { stream, periods: per, current: cm, previous: pm, trend: t.trend, delta: t.delta, risks, confidence: conf, reviewed, pending, facts };
}
