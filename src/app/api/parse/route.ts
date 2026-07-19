import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { extractJsonArray, ParseError, toParsedTasks } from "@/lib/parse-response";

const MODEL = "gemini-flash-lite-latest";
const HUMAN_ERROR = "Не вдалося обробити, спробуй ще раз";

function buildPrompt(userInput: string): string {
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

Повертай ТІЛЬКИ валідний JSON масив. Без пояснень, без markdown.

Текст юзера: ${userInput}`;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text.trim() : "";

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
      contents: buildPrompt(text),
    });

    const rawText = response.text ?? "";

    const rawArray = extractJsonArray(rawText);
    const tasks = toParsedTasks(rawArray);

    return NextResponse.json({ tasks });
  } catch (error) {
    if (error instanceof ParseError) {
      return NextResponse.json({ error: HUMAN_ERROR }, { status: 422 });
    }
    console.error("parse route failed", error);
    return NextResponse.json({ error: HUMAN_ERROR }, { status: 500 });
  }
}
