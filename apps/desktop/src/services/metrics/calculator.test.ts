import { describe, expect, it } from "vitest";

import {
  calculateConversationMetrics,
  formatDuration,
  formatRatio,
} from "./calculator";

function word(
  overrides: {
    channel?: number;
    start_ms?: number;
    end_ms?: number;
    text?: string;
  } = {},
) {
  return {
    id: "w-1",
    channel: overrides.channel ?? 0,
    start_ms: overrides.start_ms ?? 0,
    end_ms: overrides.end_ms ?? 1000,
    text: overrides.text ?? "hello",
    confidence: 1,
  };
}

describe("calculateConversationMetrics", () => {
  it("returns zero metrics for empty array", () => {
    const result = calculateConversationMetrics([]);
    expect(result).toEqual({ totalDurationMs: 0, speakers: [] });
  });

  it("single speaker returns 100% talk ratio", () => {
    const words = [
      word({ channel: 0, start_ms: 0, end_ms: 1000, text: "hello" }),
      word({ channel: 0, start_ms: 1000, end_ms: 2000, text: "world" }),
    ];
    const result = calculateConversationMetrics(words);
    expect(result.speakers).toHaveLength(1);
    expect(result.speakers[0].talkRatio).toBe(1);
    expect(result.speakers[0].speakerId).toBe("you");
  });

  it("two speakers with equal time returns ~50% each", () => {
    const words = [
      word({ channel: 0, start_ms: 0, end_ms: 1000, text: "hello" }),
      word({ channel: 1, start_ms: 1000, end_ms: 2000, text: "hi" }),
    ];
    const result = calculateConversationMetrics(words);
    expect(result.speakers).toHaveLength(2);
    for (const s of result.speakers) {
      expect(s.talkRatio).toBeCloseTo(0.5);
    }
  });

  it("detects questions (words ending with ?)", () => {
    const words = [
      word({ channel: 0, start_ms: 0, end_ms: 1000, text: "how?" }),
      word({ channel: 0, start_ms: 1000, end_ms: 2000, text: "yes" }),
    ];
    const result = calculateConversationMetrics(words);
    expect(result.speakers[0].questionCount).toBe(1);
  });

  it("calculates WPM correctly", () => {
    const words = Array.from({ length: 120 }, (_, i) =>
      word({
        channel: 0,
        start_ms: i * 500,
        end_ms: (i + 1) * 500,
        text: "word",
      })
    );
    const result = calculateConversationMetrics(words);
    expect(result.speakers[0].wordsPerMinute).toBe(120);
  });

  it("assigns channel 0 as 'you' and others as speaker-N", () => {
    const words = [
      word({ channel: 0, start_ms: 0, end_ms: 500 }),
      word({ channel: 2, start_ms: 500, end_ms: 1000 }),
    ];
    const result = calculateConversationMetrics(words);
    const ids = result.speakers.map((s) => s.speakerId).sort();
    expect(ids).toEqual(["speaker-2", "you"]);
  });
});

describe("formatDuration", () => {
  it("formats 0 milliseconds", () => {
    expect(formatDuration(0)).toBe("0s");
  });

  it("formats 30 seconds", () => {
    expect(formatDuration(30_000)).toBe("30s");
  });

  it("formats 2 minutes 30 seconds", () => {
    expect(formatDuration(150_000)).toBe("2m 30s");
  });
});

describe("formatRatio", () => {
  it("formats 0%", () => {
    expect(formatRatio(0)).toBe("0%");
  });

  it("formats 50%", () => {
    expect(formatRatio(0.5)).toBe("50%");
  });

  it("formats 100%", () => {
    expect(formatRatio(1)).toBe("100%");
  });
});
