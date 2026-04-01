import { useMemo } from "react";

import type { WordStorage } from "@hypr/store";

import { parseTranscriptWords } from "~/stt/utils";
import * as main from "~/store/tinybase/store/main";

import {
  calculateConversationMetrics,
  type ConversationMetrics,
} from "./calculator";

type WordWithId = WordStorage & { id: string };

export function useConversationMetrics(
  sessionId: string,
): ConversationMetrics | null {
  const store = main.UI.useStore(main.STORE_ID);

  return useMemo(() => {
    if (!store) return null;

    const allWords: WordWithId[] = [];

    store.forEachRow("transcripts", (transcriptId) => {
      const sid = store.getCell("transcripts", transcriptId, "session_id");
      if (sid !== sessionId) return;

      const words = parseTranscriptWords(store, transcriptId);
      allWords.push(...words);
    });

    if (allWords.length === 0) return null;

    return calculateConversationMetrics(allWords);
  }, [store, sessionId]);
}
