import type { Observation, Stream, Status } from "../types";

export const CODE_SYSTEM = "https://streamvoice.example/fhir/CodeSystem/stream-observation";

export function fhirStatus(s: Status): "final" | "preliminary" | "entered-in-error" {
  if (s === "flagged") return "preliminary";
  if (s === "rejected") return "entered-in-error";
  return "final";
}

const code = (c: string, display: string) => ({ coding: [{ system: CODE_SYSTEM, code: c, display }], text: display });

export function locationResource(s: Stream) {
  return {
    resourceType: "Location",
    id: s.id,
    status: "active",
    name: s.name,
    description: s.description,
    position: { longitude: s.lng, latitude: s.lat },
  };
}

export function personResource(observerId: string) {
  return { resourceType: "Person", id: observerId, name: [{ text: `Volunteer ${observerId}` }] };
}

export function observationResource(o: Observation) {
  const comp = (c: string, d: string, value: Record<string, unknown>) => ({ code: code(c, d), ...value });
  const notes = [
    ...(o.notes ? [{ text: `Volunteer note: ${o.notes}` }] : []),
    ...o.flags.map((f) => ({ text: `Validation flag (${f.source}) ${f.code}: ${f.message}` })),
    { text: `Review status: ${o.status}` },
  ];
  return {
    resourceType: "Observation",
    id: o.id,
    status: fhirStatus(o.status),
    category: [{ coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "survey", display: "Survey" }] }],
    code: code("stream-observation", "Stream citizen observation"),
    subject: { reference: `Location/${o.streamId}` },
    effectiveDateTime: o.observedAt,
    performer: [{ reference: `Person/${o.observerId}` }],
    component: [
      comp("clarity", "Water clarity (1 murky to 5 clear)", { valueInteger: o.clarity }),
      comp("smell", "Smell", { valueCodeableConcept: code(o.smell, o.smell) }),
      comp("species", "Species seen", { valueString: o.species.join(", ") }),
      comp("litter", "Litter (0 none to 3 heavy)", { valueInteger: o.litter }),
      comp("weather", "Weather", { valueCodeableConcept: code(o.weather, o.weather) }),
    ],
    note: notes,
  };
}
