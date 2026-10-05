import streamsJson from "../../../data/streams.json";
import obsJson from "../../../data/observations.json";
import notesJson from "../../../data/one-health-notes.json";
import type { Observation, Stream, RiskCode } from "../types";
import { validateAll } from "../validation/pipeline";

export const streams = streamsJson as Stream[];
export const oneHealthNotes = notesJson as unknown as Record<RiskCode, {
  label: string;
  people: Record<string, string>;
  pets: Record<string, string>;
  wildlife: Record<string, string>;
  environment: Record<string, string>;
}>;

/** Seed observations with the validation pipeline applied (planted inconsistent entries come out flagged). */
export const seedObservations: Observation[] = validateAll(obsJson as Observation[]);

export const SAMPLE_DATA_LABEL = "Sample data for demonstration. The pipeline accepts any observations that match the schema.";
