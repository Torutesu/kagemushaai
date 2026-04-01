import type { LiveTranscriptSegment } from "@hypr/plugin-listener";

export interface KeyPoint {
  id: string;
  text: string;
  timestamp: number;
  type: "decision" | "action" | "question" | "highlight";
}

const KEYWORD_PATTERNS: Array<{ pattern: RegExp; type: KeyPoint["type"] }> = [
  { pattern: /\b(decide|decided|decision|agree|agreed)\b/i, type: "decision" },
  {
    pattern: /\b(action item|todo|follow.?up|will do|need to|should)\b/i,
    type: "action",
  },
  { pattern: /\?$/, type: "question" },
];

export function extractKeyPoints(
  segments: LiveTranscriptSegment[],
): KeyPoint[] {
  const points: KeyPoint[] = [];

  for (const segment of segments) {
    const text = segment.text.trim();
    if (text.length < 10) continue;

    for (const { pattern, type } of KEYWORD_PATTERNS) {
      if (pattern.test(text)) {
        points.push({
          id: segment.id,
          text,
          timestamp: segment.start_ms,
          type,
        });
        break;
      }
    }
  }

  return points;
}
