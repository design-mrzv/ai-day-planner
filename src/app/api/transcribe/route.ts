import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const MODEL = "gemini-flash-lite-latest";
const GENERIC_ERROR = "Не вдалося обробити запис. Спробуй ще раз";
const NO_SPEECH_ERROR = "Не почув жодного слова. Спробуй ще раз";

const TRANSCRIBE_PROMPT =
  "Транскрибуй аудіо українською мовою. Поверни ТІЛЬКИ розпізнаний текст, без коментарів і форматування.";

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const audio = formData?.get("audio");

  if (!(audio instanceof File) || audio.size === 0) {
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("GEMINI_API_KEY is not set");
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }

  const client = new GoogleGenAI({ apiKey });

  try {
    const arrayBuffer = await audio.arrayBuffer();
    const base64Data = Buffer.from(arrayBuffer).toString("base64");

    const response = await client.models.generateContent({
      model: MODEL,
      contents: [
        TRANSCRIBE_PROMPT,
        { inlineData: { mimeType: audio.type || "audio/webm", data: base64Data } },
      ],
    });

    const text = (response.text ?? "").trim();

    if (!text) {
      return NextResponse.json({ error: NO_SPEECH_ERROR }, { status: 422 });
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("transcribe route failed", error);
    return NextResponse.json({ error: GENERIC_ERROR }, { status: 500 });
  }
}
