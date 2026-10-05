import type { Observation, Stream } from "../types";
import { locationResource, observationResource, personResource } from "./mapper";

export function buildBundle(stream: Stream, observations: Observation[]) {
  const mine = observations.filter((o) => o.streamId === stream.id);
  const people = [...new Set(mine.map((o) => o.observerId))].map(personResource);
  return {
    resourceType: "Bundle",
    type: "collection",
    entry: [locationResource(stream), ...people, ...mine.map(observationResource)].map((resource) => ({ resource })),
  };
}
