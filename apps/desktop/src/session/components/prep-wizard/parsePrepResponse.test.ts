import { describe, expect, it } from "vitest";

import { parsePrepResponse } from "./parse";

describe("parsePrepResponse", () => {
  it("returns questions and checklist from correct format", () => {
    const text = `QUESTIONS:
- What is the timeline?
- Who is the owner?

CHECKLIST:
- Review the doc
- Prepare slides`;

    const result = parsePrepResponse(text);
    expect(result.questions).toEqual([
      "What is the timeline?",
      "Who is the owner?",
    ]);
    expect(result.checklist).toEqual(["Review the doc", "Prepare slides"]);
  });

  it("returns empty questions when QUESTIONS section is missing", () => {
    const text = `CHECKLIST:
- Item one
- Item two`;

    const result = parsePrepResponse(text);
    expect(result.questions).toEqual([]);
    expect(result.checklist).toEqual(["Item one", "Item two"]);
  });

  it("returns empty checklist when CHECKLIST section is missing", () => {
    const text = `QUESTIONS:
- First question?
- Second question?`;

    const result = parsePrepResponse(text);
    expect(result.questions).toEqual(["First question?", "Second question?"]);
    expect(result.checklist).toEqual([]);
  });

  it("returns both empty for empty response", () => {
    const result = parsePrepResponse("");
    expect(result.questions).toEqual([]);
    expect(result.checklist).toEqual([]);
  });

  it("handles extra whitespace", () => {
    const text = `  QUESTIONS:
  -   What about budget?
  -   When is the deadline?

  CHECKLIST:
  -   Send invite  `;

    const result = parsePrepResponse(text);
    expect(result.questions).toEqual([
      "What about budget?",
      "When is the deadline?",
    ]);
    expect(result.checklist).toEqual(["Send invite"]);
  });

  it("ignores items without '- ' prefix", () => {
    const text = `QUESTIONS:
- Valid question?
No dash here
* Also ignored
- Another valid question?`;

    const result = parsePrepResponse(text);
    expect(result.questions).toEqual([
      "Valid question?",
      "Another valid question?",
    ]);
  });

  it("ignores items before any section header", () => {
    const text = `- Orphan line
QUESTIONS:
- Real question?`;

    const result = parsePrepResponse(text);
    expect(result.questions).toEqual(["Real question?"]);
    expect(result.checklist).toEqual([]);
  });
});
