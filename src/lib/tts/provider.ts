import type { Sentence } from "../types";

export type SpeakCallbacks = {
  onSentenceStart: (index: number) => void;
  onEnd: () => void;
  /** Provider could not continue; `index` is the sentence to resume from with another provider. */
  onError?: (index: number) => void;
};

export interface TtsProvider {
  readonly label: "AI voice" | "Device voice";
  speak(sentences: Sentence[], cb: SpeakCallbacks, startIndex?: number): void;
  pause(): void;
  resume(): void;
  stop(): void;
  setRate(rate: number): void;
  /** 0..1 progress through the whole script, for the progress bar. */
  progress(): number;
}
