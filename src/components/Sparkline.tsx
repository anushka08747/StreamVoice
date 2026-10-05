/** Small line chart of the score across periods. */
export function Sparkline({ points, labels }: { points: (number | null)[]; labels: string[] }) {
  const w = 240, h = 84, pad = 18;
  const valid = points.map((p, i) => ({ p, i })).filter((x) => x.p !== null) as { p: number; i: number }[];
  const x = (i: number) => pad + (i * (w - 2 * pad)) / Math.max(1, points.length - 1);
  const y = (v: number) => h - pad - (v / 100) * (h - 2 * pad - 8);
  const line = valid.map((v) => `${x(v.i)},${y(v.p)}`).join(" ");
  return (
    <div className="well inline-block px-3 pb-2 pt-3">
      <svg width={w} height={h} role="img" aria-label={`Score by period: ${points.map((p, i) => `${labels[i]} ${p ?? "no data"}`).join(", ")}`}>
        <defs>
          <linearGradient id="spark" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {valid.length > 1 && (
          <>
            <polygon fill="url(#spark)" points={`${x(valid[0].i)},${h - pad} ${line} ${x(valid[valid.length - 1].i)},${h - pad}`} />
            <polyline fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={line} />
          </>
        )}
        {valid.map((v) => (
          <g key={v.i}>
            <circle cx={x(v.i)} cy={y(v.p)} r="5" fill="#fff" stroke="var(--primary)" strokeWidth="2.5" />
            <text x={x(v.i)} y={y(v.p) - 11} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">{v.p}</text>
          </g>
        ))}
      </svg>
      <div className="flex justify-between px-1 text-xs font-medium text-muted">{labels.map((l) => <span key={l}>{l}</span>)}</div>
    </div>
  );
}
