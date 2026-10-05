import type { Fact, Level, Sentence, OneHealthEntry } from "../types";
import type { Beat, BeatKey } from "./outline";
import { factsForKey } from "./outline";

type Ctx = { facts: Fact[]; notes: OneHealthEntry[]; level: Level; streamName: string };

const S = (text: string, ...ids: (string | undefined)[]): Sentence => ({ text, factIds: ids.filter(Boolean) as string[] });
const v = (f: Fact | undefined, k: string) => f?.values[k];
const find = (facts: Fact[], k: string) => facts.find((f) => k in f.values);

function sentencesFor(key: BeatKey, c: Ctx, beat: Beat): Sentence[] {
  const { facts, level, streamName } = c;
  const L = level;
  switch (key) {
    case "open": {
      const f = factsForKey("open", facts)[0];
      const n = v(f, "observations"), p = v(f, "volunteers");
      if (L === "child") return [S(`Hi there! This month, ${p} people checked ${streamName}.`, f?.id), S(`Together they wrote down ${n} observations.`, f?.id)];
      if (L === "scientist") return [S(`This briefing covers ${streamName}, based on ${n} counted observations from ${p} volunteers.`, f?.id)];
      return [S(`This month, ${p} people checked ${streamName}.`, f?.id), S(`They shared ${n} observations about the water.`, f?.id)];
    }
    case "score": {
      const sf = facts.find((f) => f.kind === "score");
      const tf = facts.find((f) => f.kind === "trend" && "trend" in f.values);
      const out: Sentence[] = [];
      if (!sf) return [S("There is not enough data yet to give a health score.")];
      const sc = v(sf, "score"), prev = v(sf, "previousScore");
      if (L === "child") out.push(S(`The stream gets a health score of ${sc} out of 100.`, sf.id));
      else if (L === "scientist") out.push(S(`The composite health score is ${sc} out of 100${prev !== undefined ? `, compared with ${prev} last period` : ""}.`, sf.id));
      else out.push(S(`The stream's health score is ${sc} out of 100${prev !== undefined ? `, compared with ${prev} last period` : ""}.`, sf.id));
      if (tf) {
        const t = String(v(tf, "trend"));
        const word = t === "declining" ? "going down" : t === "improving" ? "getting better" : "staying about the same";
        out.push(S(L === "child" ? `That means the stream is ${word}.` : `The trend is ${t}, which means the score is ${word}.`, tf.id));
      }
      return out;
    }
    case "metrics": {
      const out: Sentence[] = [];
      const cl = find(facts, "previousClarity"), sp = find(facts, "previousSpecies"), li = find(facts, "previousLitter");
      if (cl) {
        const dn = Number(v(cl, "clarity")) < Number(v(cl, "previousClarity"));
        out.push(S(L === "child" ? `The water looked ${dn ? "murkier" : "clearer"} than before.` : `Water clarity ${dn ? "dropped" : "improved"}, from ${v(cl, "previousClarity")} to ${v(cl, "clarity")} on a 1 to 5 scale.`, cl.id));
      }
      if (sp) {
        const dn = Number(v(sp, "species")) < Number(v(sp, "previousSpecies"));
        out.push(S(L === "child" ? `People spotted ${dn ? "fewer" : "more"} kinds of little animals.` : `Distinct species seen went from ${v(sp, "previousSpecies")} to ${v(sp, "species")}.`, sp.id));
      }
      if (li) {
        const up = Number(v(li, "litter")) > Number(v(li, "previousLitter"));
        out.push(S(L === "child" ? `There was ${up ? "more" : "less"} trash on the bank.` : `Average litter went from ${v(li, "previousLitter")} to ${v(li, "litter")} on a 0 to 3 scale.`, li.id));
      }
      if (!out.length) out.push(S("Clarity, species, and litter stayed about the same as last period."));
      return out;
    }
    case "signal": {
      const risks = factsForKey("signal", facts);
      if (!risks.length) return [S("No warning signs were raised this period.")];
      return risks.map((r) => {
        const code = String(v(r, "code"));
        const adult: Record<string, string> = {
          RUNOFF_SIGNAL: "Together, murkier water and fewer species can signal runoff pollution.",
          LITTER_RISING: "More litter may point to dumping or trash washing in from nearby.",
          ODOR_REPORTED: "A sewage or chemical smell can signal contamination.",
          LOW_BIODIVERSITY: "Seeing only a few kinds of species can signal a stressed stream.",
          LOW_DATA: "With so few checks, this picture may point in the wrong direction, so please treat it as uncertain.",
        };
        const kid: Record<string, string> = {
          RUNOFF_SIGNAL: "Dirty water and fewer bugs can be a sign that rain washed pollution in.",
          LITTER_RISING: "More trash may point to people dumping it nearby.",
          ODOR_REPORTED: "A bad smell can be a sign the water is not clean.",
          LOW_BIODIVERSITY: "Seeing few animals can be a sign the stream is unwell.",
          LOW_DATA: "We have only a few checks so far, so we are not sure yet.",
        };
        return S((L === "child" ? kid : adult)[code] ?? r.text, r.id);
      });
    }
    case "why_people":
    case "why_wild": {
      const short = beat.targetWords < 80; // 1 minute briefings stay brief
      const cats = beat.noteCategories
        .filter((cat) => (key === "why_people" ? cat === "people" || cat === "pets" : cat === "wildlife" || cat === "environment"))
        .slice(0, short ? 1 : 2);
      const riskFacts = factsForKey(key, facts);
      const out: Sentence[] = [];
      c.notes.slice(0, short ? 1 : undefined).forEach((n) => {
        const rf = riskFacts.find((f) => f.values.code === n.code);
        cats.forEach((cat, i) => {
          if (key === "why_people" && n === c.notes[0] && i === 0) out.push(S("Here is why that matters.", rf?.id));
          out.push(S(n[cat], rf?.id));
        });
      });
      if (!out.length) out.push(S("With no risk flags raised, there is nothing special to watch for right now."));
      return out;
    }
    case "confidence": {
      const f = factsForKey("confidence", facts)[0];
      const conf = String(v(f, "confidence")), pending = v(f, "pending");
      const out: Sentence[] = [S(L === "scientist" ? `Confidence in this summary is ${conf}.` : `We feel ${conf.toLowerCase()} confidence in this story.`, f?.id)];
      if (Number(pending) > 0) out.push(S(`${pending} entries are waiting for a reviewer and are not counted yet.`, f?.id));
      out.push(S(L === "child" ? "You can help by visiting the stream and adding what you see." : "You can help by adding your own observation next time you visit."));
      return out;
    }
  }
}

export function fallbackBeat(beat: Beat, c: Ctx): Sentence[] {
  return beat.keys.flatMap((k) => sentencesFor(k, c, beat)).map((s) => ({ ...s, beat: beat.index }));
}

export function fallbackScript(beats: Beat[], c: Ctx): Sentence[] {
  return beats.flatMap((b) => fallbackBeat(b, c));
}
