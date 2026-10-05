import type { Observation, ValidationFlag } from "../types";

const flag = (code: string, message: string): ValidationFlag => ({ code, message, source: "rule" });
const has = (text: string | undefined, words: string[]) => !!text && words.some((w) => text.toLowerCase().includes(w));

export function median(xs: number[]): number {
  if (!xs.length) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const DAY = 86400000;

/** `history` = other counted observations of the same stream. */
export function runRules(o: Observation, history: Observation[] = []): ValidationFlag[] {
  const out: ValidationFlag[] = [];
  const t = Date.parse(o.observedAt);
  const sp = o.species.map((s) => s.toLowerCase());

  const fishish = sp.some((s) => s.includes("fish") || s.includes("minnow")) || sp.length >= 4;
  if (fishish && o.clarity === 1 && (o.smell === "sewage" || o.smell === "chemical")) {
    out.push(flag("FISH_BUT_HEAVY_POLLUTION", "Fish or many species were seen, but the water was very murky and smelled of sewage or chemicals. Please check which is right."));
  }
  if (o.clarity >= 4 && has(o.notes, ["scum", "algae", "bloom", "foam"])) {
    out.push(flag("CLEAR_BUT_ALGAE_NOTE", "The water was marked clear, but the notes mention scum, algae, or foam."));
  }
  if (o.litter === 0 && has(o.notes, ["trash", "bags", "bottles", "dumping"])) {
    out.push(flag("NO_LITTER_BUT_TRASH_NOTE", "Litter was marked none, but the notes mention trash or dumping."));
  }
  const recent = history.filter((h) => {
    const d = Date.parse(h.observedAt);
    return d <= t && t - d <= 30 * DAY && h.id !== o.id;
  });
  if (recent.length >= 3) {
    const med = median(recent.map((h) => h.clarity));
    if (Math.abs(o.clarity - med) >= 3) {
      out.push(flag("OUTLIER_VS_STREAM", `Clarity ${o.clarity} is very different from this stream's usual recent clarity (${med}).`));
    }
  }
  if (o.weather === "heavy_rain" && o.clarity === 5) {
    out.push(flag("RAIN_CLARITY_MISMATCH", "Heavy rain was reported but the water was marked very clear. Please confirm."));
  }
  return out;
}
