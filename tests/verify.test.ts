import { describe, it, expect } from "vitest";
import { verifySentence, verifyScript } from "../src/lib/narration/verify";
import { fallbackScript } from "../src/lib/narration/fallback";
import { buildOutline } from "../src/lib/narration/outline";
import { computeInsights } from "../src/lib/insights/facts";
import { seedObservations, streams } from "../src/lib/store/seed";
import { oneHealthFor, wordCount } from "../src/lib/narration";
import type { Level, Minutes } from "../src/lib/types";

const ins = computeInsights(streams[0], seedObservations);
const facts = ins.facts;

describe("verifier", () => {
  it("accepts supported numbers", () => {
    expect(verifySentence({ text: "The health score is 49 out of 100.", factIds: ["F3"] }, facts)).toEqual([]);
  });
  it("rejects invented numbers, unknown ids, causal words, unknown species", () => {
    expect(verifySentence({ text: "The score is 77.", factIds: ["F3"] }, facts).length).toBeGreaterThan(0);
    expect(verifySentence({ text: "Fine.", factIds: ["F99"] }, facts).length).toBeGreaterThan(0);
    expect(verifySentence({ text: "This is caused by a factory.", factIds: [] }, facts).length).toBeGreaterThan(0);
    expect(verifySentence({ text: "Trout were seen.", factIds: [] }, facts).length).toBeGreaterThan(0);
    expect(verifySentence({ text: "Three people helped.", factIds: ["F3"] }, facts).length).toBeGreaterThan(0);
  });
});

describe("fallback narration", () => {
  for (const level of ["child", "adult", "scientist"] as Level[]) {
    for (const minutes of [1, 2, 3] as Minutes[]) {
      it(`passes the verifier: ${level} ${minutes}min`, () => {
        const notes = oneHealthFor(ins, level);
        const beats = buildOutline(facts, level, minutes);
        const script = fallbackScript(beats, { facts, notes, level, streamName: ins.stream.name });
        const notesText = notes.map((n) => `${n.people} ${n.pets} ${n.wildlife} ${n.environment}`).join(" ");
        expect(verifyScript(script, facts, notesText)).toEqual([]);
        expect(wordCount(script)).toBeGreaterThan(20);
      });
    }
  }
});
