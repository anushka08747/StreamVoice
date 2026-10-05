import { BAND_COLOR, BAND_LABEL, healthBand } from "@/lib/ui";

/** Progress ring with the score in the middle; the label pairs the colour with words. */
export function HealthBadge({ score, size = 96, showLabel = true }: { score: number | null; size?: number; showLabel?: boolean }) {
  const band = healthBand(score);
  const stroke = Math.max(6, size / 12);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = score === null ? 0 : score / 100;
  return (
    <div className="inline-flex flex-col items-center gap-1.5" role="img" aria-label={`Health score ${score ?? "unknown"} out of 100, ${BAND_LABEL[band]}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-2)" strokeWidth={stroke} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={BAND_COLOR[band]} strokeWidth={stroke} strokeLinecap="round"
            strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ transition: "stroke-dashoffset 600ms ease" }} />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-bold" style={{ fontSize: size * 0.3 }}>{score ?? "?"}</span>
      </div>
      {showLabel && <span className="text-xs font-semibold" style={{ color: BAND_COLOR[band] }}>{BAND_LABEL[band]}</span>}
    </div>
  );
}
