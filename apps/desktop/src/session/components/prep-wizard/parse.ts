export function parsePrepResponse(text: string): {
  questions: string[];
  checklist: string[];
} {
  const questions: string[] = [];
  const checklist: string[] = [];

  let section: "none" | "questions" | "checklist" = "none";

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (/^QUESTIONS:/i.test(trimmed)) {
      section = "questions";
      continue;
    }
    if (/^CHECKLIST:/i.test(trimmed)) {
      section = "checklist";
      continue;
    }
    if (trimmed.startsWith("- ")) {
      const item = trimmed.slice(2).trim();
      if (!item) continue;
      if (section === "questions") questions.push(item);
      else if (section === "checklist") checklist.push(item);
    }
  }

  return { questions, checklist };
}
