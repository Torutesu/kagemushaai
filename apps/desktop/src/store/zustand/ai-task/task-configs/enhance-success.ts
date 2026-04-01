import { md2json } from "@hypr/tiptap/shared";

import { calculateConversationMetrics } from "~/services/metrics/calculator";
import { parseTranscriptWords } from "~/stt/utils";

import { createTaskId, type TaskConfig } from ".";
import type { Store as MainStore } from "~/store/tinybase/store/main";

function computeSessionMetrics(store: MainStore, sessionId: string): string | null {
  const allWords: ReturnType<typeof parseTranscriptWords> = [];

  store.forEachRow("transcripts", (transcriptId: string) => {
    const sid = store.getCell("transcripts", transcriptId, "session_id");
    if (sid !== sessionId) return;
    const words = parseTranscriptWords(store, transcriptId);
    allWords.push(...words);
  });

  if (allWords.length === 0) return null;

  const metrics = calculateConversationMetrics(allWords);
  return JSON.stringify(metrics);
}

const onSuccess: NonNullable<TaskConfig<"enhance">["onSuccess"]> = ({
  text,
  args,
  model,
  store,
  startTask,
  getTaskState,
}) => {
  if (!text) {
    return;
  }

  try {
    const jsonContent = md2json(text);
    const metricsJson = computeSessionMetrics(store, args.sessionId);

    const contentWithMetrics = metricsJson
      ? JSON.stringify({ ...jsonContent, _conversationMetrics: JSON.parse(metricsJson) })
      : JSON.stringify(jsonContent);

    store.setPartialRow("enhanced_notes", args.enhancedNoteId, {
      content: contentWithMetrics,
    });
  } catch (error) {
    console.error("Failed to convert markdown to JSON:", error);
    return;
  }

  const currentTitle = store.getCell("sessions", args.sessionId, "title");
  const trimmedTitle =
    typeof currentTitle === "string" ? currentTitle.trim() : "";
  if (trimmedTitle) {
    return;
  }

  const titleTaskId = createTaskId(args.sessionId, "title");
  const titleTask = getTaskState(titleTaskId);
  if (titleTask?.status === "generating" || titleTask?.status === "success") {
    return;
  }

  void startTask(titleTaskId, {
    model,
    taskType: "title",
    args: { sessionId: args.sessionId },
  });
};

export const enhanceSuccess: Pick<TaskConfig<"enhance">, "onSuccess"> = {
  onSuccess,
};
