"use client";
import Link from "next/link";
import { CalendarCheck, Droplet, Eye, Flame, Headphones, Lock, Plus, Waves, type LucideIcon } from "lucide-react";
import { useApp } from "@/lib/store/AppContext";
import { computeBadges, type BadgeId } from "@/lib/gamification/badges";
import { currentStreak } from "@/lib/gamification/streaks";
import { streams } from "@/lib/store/seed";
import { Card, Chip, Input, PageHeader, Segmented, StatCard, cx } from "@/components/ui";

const BADGE_ICON: Record<BadgeId, LucideIcon> = {
  "first-drop": Droplet, regular: CalendarCheck, "sharp-eye": Eye, "stream-keeper": Waves, "heard-it-first": Headphones,
};
const STATUS_TONE = { accepted: "good", confirmed: "good", corrected: "primary", flagged: "warn", rejected: "bad" } as const;

export default function ProfilePage() {
  const { observations, profile, setProfile } = useApp();
  const mine = observations.filter((o) => o.observerId === profile.id).sort((a, b) => b.observedAt.localeCompare(a.observedAt));
  const badges = computeBadges(observations, profile.id, profile.heardFull);
  const streak = currentStreak(observations, profile.id);
  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Profile" subtitle="Your contributions, streak, and badges. Stored only in this browser." />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card className="space-y-5">
          <label className="block"><span className="mb-2 block text-sm font-semibold">Display name</span>
            <Input value={profile.name} maxLength={40} onChange={(e) => setProfile({ name: e.target.value })} /></label>
          <div>
            <p className="mb-2 text-sm font-semibold">Role</p>
            <Segmented label="Role" value={profile.role} onChange={(role) => setProfile({ role })}
              options={[{ value: "volunteer", label: "Volunteer" }, { value: "reviewer", label: "Reviewer" }]} />
          </div>
        </Card>
        <div className="grid grid-cols-3 gap-4">
          <StatCard icon={<Flame size={16} />} label="Week streak" value={streak} tone="warn" />
          <StatCard icon={<Droplet size={16} />} label="Observations" value={mine.length} />
          <StatCard icon={<CalendarCheck size={16} />} label="Badges" value={`${badges.filter((b) => b.earned).length}/${badges.length}`} tone="good" />
        </div>
      </div>

      <p className="eyebrow mb-3 mt-10">Badges</p>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {badges.map((b) => {
          const I = BADGE_ICON[b.id];
          return (
            <li key={b.id} className={cx("card flex flex-col items-center p-5 text-center", b.earned ? "pop" : "opacity-70")}>
              <span className={cx("inline-flex h-14 w-14 items-center justify-center rounded-full", b.earned ? "text-white" : "bg-bg-2 text-muted")}
                style={b.earned ? { background: "linear-gradient(135deg, var(--primary-2), var(--primary))", boxShadow: "var(--shadow-btn)" } : undefined}>
                {b.earned ? <I size={24} aria-hidden /> : <Lock size={20} aria-hidden />}
              </span>
              <p className="mt-3 font-semibold">{b.name}</p>
              <p className="mt-1 text-xs text-muted">{b.description}</p>
              <span className="sr-only">{b.earned ? "Earned" : "Locked"}</span>
            </li>
          );
        })}
      </ul>

      <p className="eyebrow mb-3 mt-10">Your contributions ({mine.length})</p>
      {mine.length === 0 ? (
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-ink-soft">No observations yet. Add your first one to earn First Drop.</p>
          <Link href="/app/contribute" className="btn btn-primary"><Plus size={18} aria-hidden />Contribute</Link>
        </Card>
      ) : (
        <ul className="space-y-3">
          {mine.map((o) => (
            <li key={o.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
              <span><strong>{streams.find((s) => s.id === o.streamId)?.name}</strong> <span className="text-sm text-muted">{o.observedAt}, clarity {o.clarity} of 5</span></span>
              <Chip tone={STATUS_TONE[o.status]} className="capitalize">{o.status}</Chip>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
