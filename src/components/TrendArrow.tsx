import { ArrowDownRight, ArrowRight, ArrowUpRight, HelpCircle } from "lucide-react";
import type { Trend } from "@/lib/types";
import { Chip } from "./ui";

const MAP = {
  improving: { icon: ArrowUpRight, tone: "good", text: "Improving" },
  declining: { icon: ArrowDownRight, tone: "bad", text: "Declining" },
  stable: { icon: ArrowRight, tone: "primary", text: "Stable" },
  unknown: { icon: HelpCircle, tone: "neutral", text: "Trend unknown" },
} as const;

export function TrendArrow({ trend, delta }: { trend: Trend; delta?: number | null }) {
  const m = MAP[trend];
  return (
    <Chip tone={m.tone} icon={<m.icon size={14} />}>
      {m.text}{delta !== undefined && delta !== null ? ` (${delta > 0 ? "+" : ""}${delta})` : ""}
    </Chip>
  );
}
