import { NextRequest, NextResponse } from "next/server";

/** Proxy to the public HL7 test server $validate endpoint. Fails gracefully. */
export async function POST(req: NextRequest) {
  const bundle = await req.json().catch(() => null);
  if (!bundle) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  try {
    const res = await fetch("https://hapi.fhir.org/baseR4/Bundle/$validate", {
      method: "POST",
      headers: { "Content-Type": "application/fhir+json" },
      body: JSON.stringify(bundle),
      signal: AbortSignal.timeout(10000),
    });
    const outcome = await res.json();
    return NextResponse.json({ ok: res.ok, outcome });
  } catch {
    return NextResponse.json({ ok: false, error: "The public FHIR test server could not be reached." }, { status: 502 });
  }
}
