import { Bird, Dog, Leaf, UsersRound } from "lucide-react";
import type { OneHealthEntry } from "@/lib/types";
import { Card, IconBubble } from "./ui";

const CATS = [
  { key: "people", icon: UsersRound, label: "People", tone: "primary" },
  { key: "pets", icon: Dog, label: "Pets", tone: "warn" },
  { key: "wildlife", icon: Bird, label: "Wildlife", tone: "good" },
  { key: "environment", icon: Leaf, label: "Environment", tone: "good" },
] as const;

export function OneHealthCard({ entry }: { entry: OneHealthEntry }) {
  return (
    <Card>
      <h3 className="mb-5 text-lg">{entry.label}</h3>
      <ul className="grid gap-5 sm:grid-cols-2">
        {CATS.map((c) => (
          <li key={c.key} className="flex gap-3">
            <IconBubble tone={c.tone} size={40}><c.icon size={18} /></IconBubble>
            <span className="text-sm leading-relaxed text-ink-soft"><strong className="block text-ink">{c.label}</strong>{entry[c.key]}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
