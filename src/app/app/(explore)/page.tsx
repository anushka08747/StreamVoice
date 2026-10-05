"use client";
import Link from "next/link";
import { AlertTriangle, ChevronRight, Droplets, Users } from "lucide-react";
import { useAllInsights } from "@/lib/ui";
import { HealthBadge } from "@/components/HealthBadge";
import { TrendArrow } from "@/components/TrendArrow";
import { StatCard } from "@/components/ui";

export default function Home() {
  const all = useAllInsights();
  const obs = all.reduce((n, i) => n + i.current.n, 0);
  const pending = all.reduce((n, i) => n + i.pending, 0);
  return (
    <>
      <div>
        <h1 className="text-gradient text-4xl">Streams</h1>
        <p className="mt-2 text-ink-soft">Pick a stream on the map or below to hear what volunteers found this period.</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatCard icon={<Droplets size={16} />} label="Streams" value={all.length} />
        <StatCard icon={<Users size={16} />} label="Observations" value={obs} tone="good" />
        <StatCard icon={<AlertTriangle size={16} />} label="In review" value={pending} tone={pending ? "warn" : "neutral"} />
      </div>
      <div>
        <p className="eyebrow mb-3">Monitored streams ({all.length})</p>
        <ul className="space-y-4">
          {all.map((i) => (
            <li key={i.stream.id}>
              <Link href={`/app/streams/${i.stream.id}`} className="card hover-lift group flex items-center gap-5 p-5">
                <HealthBadge score={i.current.score} size={64} showLabel={false} />
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg">{i.stream.name}</h2>
                  <p className="truncate text-sm text-ink-soft">{i.stream.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <TrendArrow trend={i.trend} />
                    <span className="chip bg-bg-2 text-ink-soft">{i.current.n} observations</span>
                    {i.pending > 0 && <span className="chip bg-warn-soft text-[#9A5B05]">{i.pending} in review</span>}
                  </div>
                </div>
                <ChevronRight size={20} className="text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}
