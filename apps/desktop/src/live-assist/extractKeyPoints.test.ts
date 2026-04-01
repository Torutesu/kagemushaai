import { describe, expect, it } from "vitest";

import type { LiveTranscriptSegment } from "@hypr/plugin-listener";

import { extractKeyPoints } from "./extractKeyPoints";

function segment(overrides: {
  id?: string;
  text: string;
  start_ms?: number;
}): LiveTranscriptSegment {
  return {
    id: overrides.id ?? "seg-1",
    text: overrides.text,
    start_ms: overrides.start_ms ?? 0,
    end_ms: (overrides.start_ms ?? 0) + 1000,
    key: { channel: "DirectMic" },
    words: [],
  };
}

describe("extractKeyPoints", () => {
  it("detects decision keywords ('we decided', 'agreed')", () => {
    const segments = [
      segment({ text: "We decided to go with option A for the project" }),
      segment({ text: "Everyone agreed on the timeline for delivery" }),
    ];
    const result = extractKeyPoints(segments);
    expect(result).toHaveLength(2);
    expect(result[0].type).toBe("decision");
    expect(result[1].type).toBe("decision");
  });

  it("detects action keywords ('action item', 'need to', 'follow up')", () => {
    const segments = [
      segment({ text: "Action item: update the documentation by Friday" }),
      segment({ text: "We need to review the pull request soon" }),
      segment({ text: "Please follow up with the client on this" }),
    ];
    const result = extractKeyPoints(segments);
    expect(result).toHaveLength(3);
    for (const p of result) {
      expect(p.type).toBe("action");
    }
  });

  it("detects questions (ends with ?)", () => {
    const segments = [
      segment({ text: "What is the expected launch date?" }),
    ];
    const result = extractKeyPoints(segments);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("question");
  });

  it("skips short segments (< 10 chars)", () => {
    const segments = [
      segment({ text: "OK?" }),
      segment({ text: "yes" }),
      segment({ text: "short" }),
    ];
    const result = extractKeyPoints(segments);
    expect(result).toHaveLength(0);
  });

  it("returns empty array for empty segments", () => {
    const result = extractKeyPoints([]);
    expect(result).toEqual([]);
  });

  it("returns only the first matching pattern per segment", () => {
    const segments = [
      segment({ text: "We decided to follow up on this issue?" }),
    ];
    const result = extractKeyPoints(segments);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("decision");
  });

  it("ignores segments that match no pattern", () => {
    const segments = [
      segment({ text: "The weather is nice today and it is sunny" }),
    ];
    const result = extractKeyPoints(segments);
    expect(result).toHaveLength(0);
  });
});
