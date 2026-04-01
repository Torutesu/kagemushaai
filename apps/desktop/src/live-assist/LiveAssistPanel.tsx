import { useCallback, useEffect, useRef, useState } from "react";
import { streamText } from "ai";

import { cn } from "@hypr/utils";

import { useLanguageModel } from "~/ai/hooks/useLLMConnection";
import { t } from "~/i18n";
import { useListener } from "~/stt/contexts";
import { extractKeyPoints, type KeyPoint } from "./extractKeyPoints";

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

const SUMMARIZE_SYSTEM_PROMPT = `You are a meeting assistant. Given the recent transcript segments, provide a brief 2-3 sentence summary of what was discussed. Focus on key decisions, action items, and important topics. Be concise.`;

const SUMMARIZE_DEBOUNCE_MS = 30_000;

export function LiveAssistPanel() {
  const liveSegments = useListener((state) => state.liveSegments);
  const model = useLanguageModel();
  const [keyPoints, setKeyPoints] = useState<KeyPoint[]>([]);
  const [summary, setSummary] = useState("");
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const lastSummarizedCountRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const segmentsRef = useRef(liveSegments);
  segmentsRef.current = liveSegments;

  useEffect(() => {
    const points = extractKeyPoints(liveSegments);
    setKeyPoints(points);
  }, [liveSegments]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [keyPoints, summary]);

  const runSummary = useCallback(async () => {
    const segments = segmentsRef.current;
    if (!model || segments.length === 0) return;
    if (segments.length === lastSummarizedCountRef.current) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsSummarizing(true);
    setSummaryError(null);
    lastSummarizedCountRef.current = segments.length;

    const recentText = segments
      .slice(-20)
      .map((s) => s.text)
      .join("\n");

    try {
      const parts: string[] = [];
      const result = streamText({
        model,
        system: SUMMARIZE_SYSTEM_PROMPT,
        prompt: recentText,
        abortSignal: abortRef.current.signal,
      });

      for await (const chunk of result.textStream) {
        parts.push(chunk);
        setSummary(parts.join(""));
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") return;
      setSummaryError(t("liveAssist.error"));
    } finally {
      setIsSummarizing(false);
    }
  }, [model]);

  useEffect(() => {
    if (!model || liveSegments.length < 5) return;
    if (liveSegments.length === lastSummarizedCountRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(runSummary, SUMMARIZE_DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [liveSegments.length, model, runSummary]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <div className={cn(["flex h-full flex-col", "rounded-lg border bg-white"])}>
      <div
        className={cn([
          "flex items-center justify-between",
          "border-b px-4 py-3",
          "text-sm font-medium",
        ])}
      >
        <div className="flex items-center gap-2">
          <span>{t("liveAssist.title")}</span>
          <span className="text-muted-foreground">
            ({keyPoints.length} {t("liveAssist.points")})
          </span>
        </div>
        {model && liveSegments.length >= 5 && (
          <button
            onClick={runSummary}
            disabled={isSummarizing}
            className={cn([
              "rounded px-2 py-1 text-xs",
              "bg-primary/10 text-primary hover:bg-primary/20",
              "disabled:opacity-50",
            ])}
          >
            {isSummarizing ? t("liveAssist.summarizing") : t("liveAssist.summarize")}
          </button>
        )}
      </div>

      <div ref={scrollRef} className={cn(["flex-1 overflow-y-auto", "p-3"])}>
        {summaryError && (
          <div className="mb-3 rounded-md border border-red-200 bg-red-50 p-2 text-xs text-red-700">
            {summaryError}
          </div>
        )}

        {summary && (
          <div
            className={cn([
              "mb-3 rounded-lg border p-3",
              "bg-primary/5",
            ])}
          >
            <div className="mb-1 text-xs font-medium text-primary">
              {t("liveAssist.aiSummary")}
            </div>
            <p className="text-sm leading-relaxed">{summary}</p>
          </div>
        )}

        {keyPoints.length === 0 && !summary ? (
          <div
            className={cn([
              "flex h-full items-center justify-center",
              "text-sm text-muted-foreground",
            ])}
          >
            {t("liveAssist.placeholder")}
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
