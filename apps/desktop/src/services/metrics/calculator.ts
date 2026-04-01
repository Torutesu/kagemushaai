import type { WordStorage } from "@hypr/store";

type WordWithId = WordStorage & { id: string };

export interface SpeakerMetrics {
  speakerId: string;
  talkTimeMs: number;
  talkRatio: number;
  wordCount: number;
  wordsPerMinute: number;
  questionCount: number;
}

export interface ConversationMetrics {
  totalDurationMs: number;
  speakers: SpeakerMetrics[];
}

export function calculateConversationMetrics(
  words: WordWithId[],
): ConversationMetrics {
  if (words.length === 0) {
    return { totalDurationMs: 0, speakers: [] };
  }

  const minStartMs = Math.min(...words.map((w) => w.start_ms));
  const maxEndMs = Math.max(...words.map((w) => w.end_ms));
  const totalDurationMs = maxEndMs - minStartMs;

  const grouped = new Map<
    string,
    { talkTimeMs: number; wordCount: number; questionCount: number }
  >();

  for (const word of words) {
    const speakerId = word.channel === 0 ? "you" : `speaker-${word.channel}`;
    let entry = grouped.get(speakerId);
    if (!entry) {
      entry = { talkTimeMs: 0, wordCount: 0, questionCount: 0 };
      grouped.set(speakerId, entry);
    }

    entry.talkTimeMs += Math.max(0, word.end_ms - word.start_ms);
    entry.wordCount += 1;

    if (word.text.trim().endsWith("?")) {
      entry.questionCount += 1;
    }
  }

  const speakers: SpeakerMetrics[] = [];
  const totalTalkTime = Array.from(grouped.values()).reduce(
    (sum, e) => sum + e.talkTimeMs,
    0,
  );

  for (const [speakerId, entry] of grouped) {
    const talkTimeMinutes = entry.talkTimeMs / 60_000;
    speakers.push({
      speakerId,
      talkTimeMs: entry.talkTimeMs,
      talkRatio: totalTalkTime > 0 ? entry.talkTimeMs / totalTalkTime : 0,
      wordCount: entry.wordCount,
      wordsPerMinute:
        talkTimeMinutes > 0
          ? Math.round(entry.wordCount / talkTimeMinutes)
          : 0,
      questionCount: entry.questionCount,
    });
  }

  speakers.sort((a, b) => b.talkTimeMs - a.talkTimeMs);

  return { totalDurationMs, speakers };
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

export function formatRatio(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}
