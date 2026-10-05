import { NextRequest, NextResponse } from "next/server";
import { validateNew } from "@/lib/validation/pipeline";
import type { Observation } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { observation?: Observation; history?: Observation[] } | null;
  if (!body?.observation) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const result = await validateNew(body.observation, body.history ?? []);
  return NextResponse.json(result);
}
