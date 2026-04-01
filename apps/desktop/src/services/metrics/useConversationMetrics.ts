import { useMemo } from "react";

import { parseTranscriptWords } from "~/stt/utils";
import * as main from "~/store/tinybase/store/main";

import {
  calculateConversationMetrics,
  type ConversationMetrics,
} from "./calculator";

export function useConversationMetrics(
  sessionId: string,
): ConversationMetrics | null {
  const store = main.UI.useStore(main.STORE_ID);

  return useMemo(() => {
    if (!store) return null;

    const allWords: Array<{ id: string } & Record<string, unknown>> = [];

    store.forEachRow("transcripts", (transcriptId) => {
      const sid = store.getCell("transcripts", transcriptId, "session_id");
      if (sid !== sessionId) return;

      const words = parseTranscriptWords(store, transcriptId);
      allWords.push(...words);
    });

    if (allWords.length === 0) return null;

    return calculateConversationMetrics(allWords as any);
  }, [store, sessionId]);
}
