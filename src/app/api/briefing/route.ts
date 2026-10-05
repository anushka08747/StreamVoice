import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { computeInsights } from "@/lib/insights/facts";
import { generateBriefing } from "@/lib/narration";
import { streams } from "@/lib/store/seed";
import { validateAll } from "@/lib/validation/pipeline";
import type { Observation } from "@/lib/types";

export const maxDuration = 60;

const Req = z.object({
  streamId: z.string(),
  observations: z.array(z.any()).max(2000),
  level: z.enum(["child", "adult", "scientist"]),
  minutes: z.union([z.literal(1), z.literal(2), z.literal(3)]),
});

/** The server recomputes facts itself; the client only supplies observations. */
export async function POST(req: NextRequest) {
  const parsed = Req.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const { streamId, observations, level, minutes } = parsed.data;
  const stream = streams.find((s) => s.id === streamId);
  if (!stream) return NextResponse.json({ error: "unknown_stream" }, { status: 404 });
  // Re-run the rule checks server-side so the client cannot smuggle flagged entries into the facts.
  const insights = computeInsights(stream, validateAll(observations as Observation[]));
  const briefing = await generateBriefing(insights, level, minutes);
  return NextResponse.json(briefing);
}
