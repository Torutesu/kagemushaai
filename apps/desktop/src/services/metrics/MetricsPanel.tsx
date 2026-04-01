import { cn } from "@hypr/utils";

import {
  formatDuration,
  formatRatio,
  type ConversationMetrics,
} from "./calculator";

export function MetricsPanel({ metrics }: { metrics: ConversationMetrics }) {
  return (
    <div className={cn(["flex flex-col gap-3", "p-4 text-sm"])}>
      <div className={cn(["flex items-center justify-between"])}>
        <span className="text-muted-foreground">Meeting Duration</span>
        <span className="font-medium">
          {formatDuration(metrics.totalDurationMs)}
        </span>
      </div>

      {metrics.speakers.map((speaker) => (
        <div
          key={speaker.speakerId}
          className={cn(["flex flex-col gap-1.5", "rounded-lg border p-3"])}
        >
          <div className={cn(["flex items-center justify-between"])}>
            <span className="font-medium">
              {speaker.speakerId === "you" ? "You" : speaker.speakerId}
            </span>
            <span className="text-muted-foreground">
              {formatRatio(speaker.talkRatio)}
            </span>
          </div>

          <div
            className={cn(["h-2 w-full rounded-full", "bg-muted overflow-hidden"])}
          >
            <div
              className={cn([
                "h-full rounded-full",
                speaker.speakerId === "you" ? "bg-primary" : "bg-blue-400",
              ])}
              style={{ width: `${Math.round(speaker.talkRatio * 100)}%` }}
            />
          </div>

          <div
            className={cn([
              "flex justify-between",
              "text-xs text-muted-foreground",
            ])}
          >
            <span>{speaker.wordsPerMinute} wpm</span>
            <span>{speaker.wordCount} words</span>
            <span>{speaker.questionCount} questions</span>
          </div>
        </div>
      ))}
    </div>
  );
}
