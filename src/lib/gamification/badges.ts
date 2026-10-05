import type { Observation } from "../types";
import { longestStreak } from "./streaks";

export type BadgeId = "first-drop" | "regular" | "sharp-eye" | "stream-keeper" | "heard-it-first";
export type Badge = { id: BadgeId; name: string; description: string; earned: boolean };

export function computeBadges(obs: Observation[], observerId: string, heardFullBriefing: boolean): Badge[] {
  const mine = obs.filter((o) => o.observerId === observerId);
  const confirmed = mine.filter((o) => o.status === "confirmed").length;
  const streamsSeen = new Set(mine.map((o) => o.streamId)).size;
  return [
    { id: "first-drop", name: "First Drop", description: "Add your first observation.", earned: mine.length >= 1 },
    { id: "regular", name: "Regular", description: "Contribute 3 weeks in a row.", earned: longestStreak(obs, observerId) >= 3 },
    { id: "sharp-eye", name: "Sharp Eye", description: "Get 3 observations confirmed by a reviewer.", earned: confirmed >= 3 },
    { id: "stream-keeper", name: "Stream Keeper", description: "Observe 3 different streams.", earned: streamsSeen >= 3 },
    { id: "heard-it-first", name: "Heard It First", description: "Listen to a full briefing.", earned: heardFullBriefing },
  ];
}
