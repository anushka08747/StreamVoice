export type Stream = { id: string; name: string; lat: number; lng: number; description: string };

export type Smell = "none" | "earthy" | "sewage" | "chemical" | "other";
export type Weather = "dry" | "light_rain" | "heavy_rain" | "unknown";
export type Status = "accepted" | "flagged" | "confirmed" | "corrected" | "rejected";

export type ValidationFlag = { code: string; message: string; source: "rule" | "llm" };

export type Observation = {
  id: string;
  streamId: string;
  observerId: string;
  observedAt: string;
  clarity: 1 | 2 | 3 | 4 | 5;
  smell: Smell;
  species: string[];
  litter: 0 | 1 | 2 | 3;
  weather: Weather;
  notes?: string;
  status: Status;
  flags: ValidationFlag[];
};

export type Fact = {
  id: string;
  kind: "count" | "score" | "trend" | "risk" | "period";
  text: string;
  values: Record<string, number | string>;
  sourceObservationIds: string[];
};

export type RiskCode = "RUNOFF_SIGNAL" | "LITTER_RISING" | "ODOR_REPORTED" | "LOW_BIODIVERSITY" | "LOW_DATA";
export type Trend = "improving" | "stable" | "declining" | "unknown";
export type Confidence = "High" | "Medium" | "Low";
export type Level = "child" | "adult" | "scientist";
export type Minutes = 1 | 2 | 3;

export type Sentence = { text: string; factIds: string[]; beat?: number };

export type OneHealthEntry = {
  code: RiskCode;
  label: string;
  people: string;
  pets: string;
  wildlife: string;
  environment: string;
};

export type BriefingResponse = {
  script: Sentence[];
  facts: Fact[];
  wordCount: number;
  source: "ai" | "template";
  confidence: Confidence;
  oneHealth: OneHealthEntry[];
};
