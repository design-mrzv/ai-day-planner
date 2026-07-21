"use client";

import { useEffect, useRef, useState } from "react";
import { Mic } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DayMode, ParsedTask } from "@/lib/types";

interface CaptureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: string;
  onTextChange: (text: string) => void;
  onParsed: (tasks: ParsedTask[]) => void;
  dayMode: DayMode;
}

const OPENING_GUARD_MS = 300;
const SILENCE_TIMEOUT_MS = 5000;

// Minimal shape of what we actually use from the Web Speech API — no
// official TS lib types exist for it, and pulling in a whole @types
// package for a handful of fields isn't worth it.
interface SpeechRecognitionAlternativeLike {
  transcript: string;
}
interface SpeechRecognitionResultLike {
  0: SpeechRecognitionAlternativeLike;
  isFinal: boolean;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechRecognitionResultLike };
}
interface SpeechRecognitionErrorEventLike {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

const MIC_PERMISSION_ERROR =
  "Немає доступу до мікрофона. Дозволь у налаштуваннях браузера";
const MIC_NO_SPEECH_ERROR = "Не почув жодного слова. Спробуй ще раз";
const MIC_GENERIC_ERROR = "Не вдалося розпізнати мову. Спробуй ще раз";

export function CaptureSheet({
  open,
  onOpenChange,
  text,
  onTextChange,
  onParsed,
  dayMode,
}: CaptureSheetProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isOpening, setIsOpening] = useState(false);
  const [micSupported, setMicSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [volumeReactive, setVolumeReactive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const textRef = useRef(text);
  textRef.current = text;
  const baseTextRef = useRef("");
  const finalTranscriptRef = useRef("");
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ringRef = useRef<HTMLSpanElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  // True from the moment a session starts winding down (manual stop, silence
  // auto-stop, error, or the browser's own end-of-speech detection) until
  // `onend` actually fires. iOS Safari can be slow to tear down its native
  // audio session even after `onend` — this blocks a rapid re-tap from
  // starting a new session before the old one has genuinely released the mic.
  const isEndingRef = useRef(false);

  // Syncing isOpening to the `open` prop from an external trigger (the FAB),
  // not deriving it from other React state, so this isn't the "you might not
  // need an effect" case the lint rule assumes.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return;
    setIsOpening(true);
    const timeoutId = setTimeout(() => setIsOpening(false), OPENING_GUARD_MS);
    return () => clearTimeout(timeoutId);
  }, [open]);

  // Progressive enhancement: `window` (and the Speech Recognition API) only
  // exists client-side, so support detection can't happen during the
  // server-rendered pass — it has to run after mount.
  useEffect(() => {
    const hasSpeechRecognition =
      "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
    setMicSupported(hasSpeechRecognition);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Don't let the mic (or its analysis stream) stay hot if the sheet closes
  // mid-recording. Release the analysis stream directly rather than only
  // relying on `recognition.stop()` → `onend`, since that path is exactly
  // what this bugfix no longer trusts unconditionally.
  useEffect(() => {
    if (!open && listening) {
      recognitionRef.current?.stop();
      stopVolumeAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, listening]);

  function stopVolumeAnalysis() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    audioStreamRef.current?.getTracks().forEach((track) => track.stop());
    audioStreamRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    setVolumeReactive(false);
    if (ringRef.current) {
      ringRef.current.style.transform = "";
      ringRef.current.style.opacity = "";
    }
  }

  async function startVolumeAnalysis() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);

      audioStreamRef.current = stream;
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      setVolumeReactive(true);

      const data = new Uint8Array(analyser.frequencyBinCount);

      function tick() {
        const currentAnalyser = analyserRef.current;
        if (!currentAnalyser) return;

        currentAnalyser.getByteTimeDomainData(data);
        let sumSquares = 0;
        for (let i = 0; i < data.length; i++) {
          const normalized = (data[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const level = Math.min(1, Math.sqrt(sumSquares / data.length) * 4);

        if (ringRef.current) {
          ringRef.current.style.transform = `scale(${1 + level * 0.5})`;
          ringRef.current.style.opacity = String(0.4 * (1 - level * 0.3));
        }

        rafRef.current = requestAnimationFrame(tick);
      }
      tick();
    } catch {
      // No separate analysis stream (permission race, unsupported browser,
      // etc.) — the static CSS pulse-ring from v12 stays as the fallback.
      setVolumeReactive(false);
    }
  }

  function resetSilenceTimer() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      recognitionRef.current?.stop();
    }, SILENCE_TIMEOUT_MS);
  }

  // Called on every session-ending path (manual stop, silence auto-stop,
  // error, browser auto-end, sheet close) — not just the "happy" one. iOS
  // Safari has been observed to leave the microphone/audio session claimed
  // after only a partial cleanup, which made the second recording attempt
  // silently fail.
  function releaseVoiceSession() {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    stopVolumeAnalysis();
  }

  // A fresh `SpeechRecognition` instance per attempt, never reused across
  // sessions — reusing one `.start()`-ed-then-stopped instance is the other
  // half of the iOS Safari "works once" bug this fixes.
  function createRecognition(): SpeechRecognitionLike {
    const SpeechRecognitionCtor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike })
        .SpeechRecognition ??
      (window as unknown as { webkitSpeechRecognition: new () => SpeechRecognitionLike })
        .webkitSpeechRecognition;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "uk-UA";
    recognition.continuous = false; // повертаємо поведінку v12
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      resetSilenceTimer();

      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += `${result[0].transcript} `;
        } else {
          interim += result[0].transcript;
        }
      }

      const combined = [
        baseTextRef.current.trim(),
        finalTranscriptRef.current.trim(),
        interim,
      ]
        .filter((part) => part.length > 0)
        .join(" ");
      onTextChange(combined);
    };

    recognition.onerror = (event) => {
      releaseVoiceSession();

      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setStatus("error");
        setErrorMessage(MIC_PERMISSION_ERROR);
      } else if (event.error === "no-speech") {
        setStatus("error");
        setErrorMessage(MIC_NO_SPEECH_ERROR);
      } else {
        setStatus("error");
        setErrorMessage(MIC_GENERIC_ERROR);
      }
    };

    recognition.onend = () => {
      releaseVoiceSession();
      recognitionRef.current = null;
      isEndingRef.current = false;
      setListening(false);
    };

    return recognition;
  }

  function handleToggleMic() {
    // `isEndingRef` (a ref, always current) rather than `listening` (state,
    // can lag a render behind a rapid double-tap) is the source of truth for
    // "is a session active or still winding down" — that's the whole point
    // of tracking it separately.
    if (!isEndingRef.current) {
      setStatus("idle");
      setErrorMessage("");
      baseTextRef.current = textRef.current;
      finalTranscriptRef.current = "";
      const recognition = createRecognition();
      recognitionRef.current = recognition;
      isEndingRef.current = true;
      setListening(true);
      recognition.start();
      resetSilenceTimer();
      void startVolumeAnalysis();
      return;
    }

    // A session is active or already stopping — a tap here means "stop".
    // If it's already stopping (onend hasn't fired yet), this is a harmless
    // repeat `.stop()` call, not a new session starting on top of the old one.
    if (listening) {
      recognitionRef.current?.stop();
    }
  }

  async function handleSubmit() {
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode: dayMode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Не вдалося розібрати текст. Спробуй ще раз");
      }

      setStatus("idle");
      onParsed(data.tasks as ParsedTask[]);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Не вдалося розібрати текст. Спробуй ще раз"
      );
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} disablePointerDismissal={isOpening}>
      <DrawerContent
        initialFocus={textareaRef}
        className="rounded-t-[28px] shadow-[0_-12px_40px_rgba(28,24,21,0.18)]"
      >
        <DrawerHeader>
          <DrawerTitle className="mb-4 text-left font-sans text-[17px] font-semibold leading-6">
            Що в голові?
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-3 px-4 pb-6">
          <div className="relative">
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(event) => onTextChange(event.target.value)}
              placeholder={
                listening && !text.trim()
                  ? "Говори, я слухаю..."
                  : "Пиши все підряд, ми в цьому розберемось..."
              }
              rows={5}
              className="rounded-input border-accent-border bg-accent-tint pr-12 text-base text-text-primary placeholder:text-text-tertiary"
              disabled={status === "loading"}
            />
            {micSupported && (
              <button
                type="button"
                onClick={handleToggleMic}
                disabled={status === "loading"}
                aria-label={listening ? "Зупинити голосове введення" : "Голосове введення"}
                className={`absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  listening ? "bg-accent text-white" : "bg-transparent text-text-tertiary"
                }`}
              >
                {listening && (
                  <span
                    ref={ringRef}
                    className={`absolute inset-0 rounded-full bg-accent-tint ${
                      volumeReactive ? "" : "animate-mic-pulse-ring"
                    }`}
                  />
                )}
                <Mic size={22} strokeWidth={2} className="relative" />
              </button>
            )}
          </div>
          {status === "error" && (
            // Parent's `gap-3` already adds 12px above this element;
            // -mt-1 (-4px) nets exactly the 8px the design spec calls for.
            <p className="-mt-1 text-sm text-priority-high">{errorMessage}</p>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={text.trim().length === 0 || status === "loading"}
            className="h-14 w-full rounded-full px-6 py-4 text-base font-semibold transition-transform duration-150 active:scale-[0.98] active:bg-accent-hover"
          >
            {status === "loading" ? (
              <span className="flex items-center justify-center gap-1.5">
                <span
                  className="h-1.5 w-1.5 animate-dot-pulse rounded-full bg-current"
                  style={{ animationDelay: "0ms" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-dot-pulse rounded-full bg-current"
                  style={{ animationDelay: "150ms" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-dot-pulse rounded-full bg-current"
                  style={{ animationDelay: "300ms" }}
                />
              </span>
            ) : (
              "Обробити"
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
