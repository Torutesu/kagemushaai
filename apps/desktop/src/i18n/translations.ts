const translations = {
  en: {
    "session.welcome": "Welcome to Kagemusha AI",
    "session.startRecording": "Start Recording",
    "session.stopRecording": "Stop Recording",
    "settings.startAtLogin": "Start Kagemusha AI at login",
    "liveAssist.title": "Live Assist",
    "liveAssist.points": "points",
    "liveAssist.summarize": "Summarize",
    "liveAssist.summarizing": "Summarizing...",
    "liveAssist.placeholder": "Key points will appear here during the meeting...",
    "liveAssist.aiSummary": "AI Summary",
    "liveAssist.error": "Summary generation failed",
    "metrics.duration": "Meeting Duration",
    "metrics.you": "You",
    "metrics.wpm": "wpm",
    "metrics.words": "words",
    "metrics.questions": "questions",
    "prep.generate": "Generate Preparation",
    "prep.generating": "Generating preparation...",
    "prep.regenerate": "Regenerate",
    "prep.regenerating": "Regenerating...",
    "prep.questionsToAsk": "Questions to Ask",
    "prep.checklist": "Preparation Checklist",
    "prep.linkEvent": "Link a calendar event to use the preparation wizard.",
    "prep.parseError": "Could not parse preparation items. Try regenerating.",
    "prep.connectionError": "Preparation generation failed. Check your LLM connection.",
    "template.gunbai": "Commander's Battle Plan",
    "template.retrospective": "After-Battle Review",
    "template.briefing": "Shadow Warrior's Intelligence Brief",
  },
  ja: {
    "session.welcome": "影武者AIへようこそ",
    "session.startRecording": "出陣",
    "session.stopRecording": "凱旋",
    "settings.startAtLogin": "ログイン時に影武者AIを起動",
    "liveAssist.title": "影武者の耳打ち",
    "liveAssist.points": "件",
    "liveAssist.summarize": "要約する",
    "liveAssist.summarizing": "要約中...",
    "liveAssist.placeholder": "会議中の重要ポイントがここに表示されます...",
    "liveAssist.aiSummary": "AI要約",
    "liveAssist.error": "要約の生成に失敗しました",
    "metrics.duration": "会議時間",
    "metrics.you": "あなた",
    "metrics.wpm": "語/分",
    "metrics.words": "語",
    "metrics.questions": "質問",
    "prep.generate": "準備を生成",
    "prep.generating": "準備を生成中...",
    "prep.regenerate": "再生成",
    "prep.regenerating": "再生成中...",
    "prep.questionsToAsk": "聞くべき質問",
    "prep.checklist": "準備チェックリスト",
    "prep.linkEvent": "準備ウィザードを使うにはカレンダーイベントを紐付けてください。",
    "prep.parseError": "準備項目を解析できませんでした。再生成してください。",
    "prep.connectionError": "準備の生成に失敗しました。LLM接続を確認してください。",
    "template.gunbai": "軍配アクションアイテム",
    "template.retrospective": "戦国振り返り",
    "template.briefing": "影武者ブリーフィング",
  },
} as const;

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof translations["en"];

let currentLocale: Locale = "ja";

export function setLocale(locale: Locale) {
  currentLocale = locale;
}

export function getLocale(): Locale {
  return currentLocale;
}

export function t(key: TranslationKey): string {
  return translations[currentLocale][key] ?? translations["en"][key] ?? key;
}
