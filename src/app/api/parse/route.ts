import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import {
  extractJsonArray,
  NoTasksFoundError,
  ParseError,
  toParsedTasks,
} from "@/lib/parse-response";
import { DayMode } from "@/lib/types";

const MODEL = "gemini-flash-lite-latest";
const HUMAN_ERROR = "Не вдалося розібрати текст. Спробуй ще раз";
const NO_TASKS_ERROR = "Не знайшов жодної задачі в тексті. Спробуй описати конкретніше";

const MODE_INSTRUCTION: Record<DayMode, string> = {
  focus:
    "Сьогодні день фокусу — став вищий пріоритет складним/важливим задачам, які потребують зосередження, і нижчий — дрібним адміністративним.",
  admin:
    "Сьогодні адмін-день — став вищий пріоритет дрібним швидким справам (дзвінки, покупки, листування), навіть якщо є важча задача.",
};

function buildPrompt(userInput: string, mode: DayMode | null): string {
  const modeInstruction = mode ? `\n\n${MODE_INSTRUCTION[mode]}` : "";

  return `Ти — асистент планування. Юзер описав свої задачі вільним текстом.
Витягни всі задачі і поверни їх як JSON масив.

Для кожної задачі визнач:
- title: назва задачі (коротко, дієслово + об'єкт)
- priority: "high" | "medium" | "low"
- deadline: "today" | "tomorrow" | "YYYY-MM-DD" | null
- time: "HH:MM" | null
- label: "work" | "personal"
- description: додаткові деталі | null

Якщо в тексті НЕ вказано конкретний час (немає цифр на кшталт "14:00", "о другій", "3 година") — онови time як null, навіть якщо є слова на кшталт "ввечері", "вранці", "потім", "згодом". Не вигадуй і не оцінюй час самостійно.

Повертай ТІЛЬКИ валідний JSON масив. Без пояснень, без markdown.${modeInstruction}

Текст юзера: ${userInput}`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";
  const mode: DayMode | null =
    body?.mode === "focus" || body?.mode === "admin" ? body.mode : null;

  if (!text) {
    return NextResponse.json({ error: HUMAN_ERROR }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return NextResponse.json({ error: HUMAN_ERROR }, { status: 500 });
  }

  const client = new GoogleGenAI({ apiKey });

  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: buildPrompt(text, mode),
    });

    const rawText = response.text ?? "";

    const rawArray = extractJsonArray(rawText);
    const tasks = toParsedTasks(rawArray);

    return NextResponse.json({ tasks });
  } catch (error) {
    if (error instanceof NoTasksFoundError) {
      return NextResponse.json({ error: NO_TASKS_ERROR }, { status: 422 });
    }
    if (error instanceof ParseError) {
      return NextResponse.json({ error: HUMAN_ERROR }, { status: 422 });
    }
    console.error("parse route failed", error);
    return NextResponse.json({ error: HUMAN_ERROR }, { status: 500 });
  }
}
