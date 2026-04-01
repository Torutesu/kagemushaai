import { useCallback, useEffect, useRef, useState } from "react";
import { streamText } from "ai";

import { useLanguageModel } from "~/ai/hooks/useLLMConnection";
import { useSessionEvent } from "~/store/tinybase/hooks";
import { parsePrepResponse } from "./parse";

export interface PrepItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface PrepData {
  questions: PrepItem[];
  checklist: PrepItem[];
  isGenerating: boolean;
  error: string | null;
}

const PREP_SYSTEM_PROMPT = `You are a meeting preparation assistant. Given the meeting details, generate:
1. A list of 3-5 key questions to ask during the meeting
2. A checklist of 3-5 preparation items

Format your response exactly as:
QUESTIONS:
- [question 1]
- [question 2]
...

CHECKLIST:
- [item 1]
- [item 2]
...

Be concise and specific to the meeting topic.`;

function makeItem(text: string): PrepItem {
  return { id: crypto.randomUUID(), text, checked: false };
}

export function usePrepWizard(sessionId: string): PrepData & {
  generate: () => Promise<void>;
  toggle: (id: string) => void;
  eventTitle: string | null;
  eventDescription: string | null;
  hasEvent: boolean;
} {
  const model = useLanguageModel();
  const sessionEvent = useSessionEvent(sessionId);
  const [questions, setQuestions] = useState<PrepItem[]>([]);
  const [checklist, setChecklist] = useState<PrepItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasEvent = !!sessionEvent;
  const eventTitle = sessionEvent?.title ?? null;
  const eventDescription = sessionEvent?.description ?? null;

  const generate = useCallback(async () => {
    if (!model || !sessionEvent) return;

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsGenerating(true);
    setError(null);

    const prompt = [
      `Meeting: ${sessionEvent.title}`,
      sessionEvent.description
        ? `Description: ${sessionEvent.description}`
        : "",
      sessionEvent.location
        ? `Location: ${sessionEvent.location}`
        : "",
      `Time: ${sessionEvent.started_at} - ${sessionEvent.ended_at}`,
    ]
      .filter(Boolean)
      .join("\n");

    try {
      let fullText = "";
      const result = streamText({
        model,
        system: PREP_SYSTEM_PROMPT,
        prompt,
        abortSignal: abortRef.current.signal,
      });

      for await (const chunk of result.textStream) {
        fullText += chunk;
      }

      const parsed = parsePrepResponse(fullText);
      if (parsed.questions.length === 0 && parsed.checklist.length === 0) {
        setError("Could not parse preparation items. Try regenerating.");
        return;
      }
      setQuestions(parsed.questions.map(makeItem));
      setChecklist(parsed.checklist.map(makeItem));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError("Preparation generation failed. Check your LLM connection.");
    } finally {
      setIsGenerating(false);
    }
  }, [model, sessionEvent]);

  const toggle = useCallback((id: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, checked: !q.checked } : q)),
    );
    setChecklist((prev) =>
      prev.map((c) => (c.id === id ? { ...c, checked: !c.checked } : c)),
    );
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    questions,
    checklist,
    isGenerating,
    error,
    generate,
    toggle,
    eventTitle,
    eventDescription,
    hasEvent,
  };
}
