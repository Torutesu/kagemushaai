import { useEffect, useRef, useState } from "react";

import { cn } from "@hypr/utils";
import type { LiveTranscriptSegment } from "@hypr/plugin-listener";

import { useListener } from "~/stt/contexts";

interface KeyPoint {
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

function extractKeyPoints(segments: LiveTranscriptSegment[]): KeyPoint[] {
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

const TYPE_LABELS: Record<KeyPoint["type"], string> = {
  decision: "Decision",
  action: "Action",
  question: "Question",
  highlight: "Highlight",
};

const TYPE_COLORS: Record<KeyPoint["type"], string> = {
  decision: "bg-amber-100 text-amber-800",
  action: "bg-blue-100 text-blue-800",
  question: "bg-purple-100 text-purple-800",
  highlight: "bg-green-100 text-green-800",
};

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function LiveAssistPanel() {
  const liveSegments = useListener((state) => state.liveSegments);
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const points = extractKeyPoints(liveSegments);
    setKeyPoints(points);
  }, [liveSegments]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [keyPoints]);

  return (
    <div className={cn(["flex h-full flex-col", "rounded-lg border bg-white"])}>
      <div
        className={cn([
          "flex items-center gap-2",
          "border-b px-4 py-3",
          "text-sm font-medium",
        ])}
      >
        <span>Live Assist</span>
        <span className="text-muted-foreground">
          ({keyPoints.length} points)
        </span>
      </div>

      <div ref={scrollRef} className={cn(["flex-1 overflow-y-auto", "p-3"])}>
        {keyPoints.length === 0 ? (
          <div
            className={cn([
              "flex h-full items-center justify-center",
              "text-sm text-muted-foreground",
            ])}
          >
            Key points will appear here during the meeting...
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {keyPoints.map((point) => (
              <div
                key={point.id}
                className={cn([
                  "flex flex-col gap-1",
                  "rounded-md border p-2.5",
                ])}
              >
                <div className={cn(["flex items-center gap-2"])}>
                  <span
                    className={cn([
                      "rounded px-1.5 py-0.5 text-xs font-medium",
                      TYPE_COLORS[point.type],
                    ])}
                  >
                    {TYPE_LABELS[point.type]}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(point.timestamp)}
                  </span>
                </div>
                <p className="text-sm leading-relaxed">{point.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
