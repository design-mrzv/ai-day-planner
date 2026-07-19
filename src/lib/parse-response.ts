import { Label, ParsedTask, Priority } from "./types";

const PRIORITIES: Priority[] = ["high", "medium", "low"];
const LABELS: Label[] = ["work", "personal"];

export class ParseError extends Error {}

export function extractJsonArray(rawText: string): unknown[] {
  const stripped = rawText
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  let parsed: unknown;
  try {
    parsed = JSON.parse(stripped);
  } catch {
    throw new ParseError("AI response is not valid JSON");
  }

  if (!Array.isArray(parsed)) {
    throw new ParseError("AI response is not a JSON array");
  }

  return parsed;
}

export function toParsedTasks(rawArray: unknown[]): ParsedTask[] {
  const tasks: ParsedTask[] = [];

  for (const item of rawArray) {
    if (typeof item !== "object" || item === null) continue;
    const record = item as Record<string, unknown>;

    const title = typeof record.title === "string" ? record.title.trim() : "";
    if (!title) continue;

    const priority = PRIORITIES.includes(record.priority as Priority)
      ? (record.priority as Priority)
      : "medium";

    const label = LABELS.includes(record.label as Label)
      ? (record.label as Label)
      : "work";

    const deadline = typeof record.deadline === "string" ? record.deadline : null;
    const time = typeof record.time === "string" ? record.time : null;
    const description =
      typeof record.description === "string" ? record.description : null;

    tasks.push({ title, priority, deadline, time, label, description });
  }

  if (tasks.length === 0) {
    throw new ParseError("No tasks found in AI response");
  }

  return tasks;
}
