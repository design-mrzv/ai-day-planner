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
const SILENCE_TIMEOUT_MS = 3000;
const VOLUME_THRESHOLD = 0.05;
const MIN_RECORDING_MS = 500;
const CANDIDATE_MIME_TYPES = ["audio/webm", "audio/mp4"];

const MIC_PERMISSION_ERROR =
  "Немає доступу до мікрофона. Дозволь у налаштуваннях браузера";
const MIC_NO_SPEECH_ERROR = "Не почув жодного слова. Спробуй ще раз";
const MIC_GENERIC_ERROR = "Не вдалося обробити запис. Спробуй ще раз";

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
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [volumeReactive, setVolumeReactive] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textRef = useRef(text);
  textRef.current = text;

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recordingStartRef = useRef<number | null>(null);
  const lastLoudAtRef = useRef<number | null>(null);
  // Separate from `lastLoudAtRef` (which only tracks *recent* silence for
  // auto-stop) — this tracks whether the recording ever had any sound at
  // all. Gemini doesn't reliably return an empty transcript for pure
  // silence (observed: it hallucinated an unrelated sentence for a silent
  // test clip), so we can't rely on the server's "no speech" detection —
  // detect true silence client-side and skip the network call entirely.
  const heardAnySoundRef = useRef(false);
  const ringRef = useRef<HTMLSpanElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const analyserDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
  const rafRef = useRef<number | null>(null);

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

  // Progressive enhancement: `window` (and MediaRecorder) only exist
  // client-side, so support detection can't happen during the
  // server-rendered pass — it has to run after mount.
  useEffect(() => {
    setMicSupported(typeof window !== "undefined" && "MediaRecorder" in window);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Don't let the mic stay hot if the sheet closes mid-recording.
  useEffect(() => {
    if (!open && recording) {
      mediaRecorderRef.current?.stop();
    }
  }, [open, recording]);

  function releaseRecordingResources() {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    recordingStreamRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    analyserDataRef.current = null;
    setVolumeReactive(false);
    if (ringRef.current) {
      ringRef.current.style.transform = "";
      ringRef.current.style.opacity = "";
    }
  }

  // Drives both the volume-reactive pulse ring and silence auto-stop from
  // the same analyser — no separate `SpeechRecognition`-driven timer needed.
  function tickVolume() {
    const analyser = analyserRef.current;
    const data = analyserDataRef.current;
    if (!analyser || !data) return;

    analyser.getByteTimeDomainData(data);
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

    const now = performance.now();
    if (level > VOLUME_THRESHOLD) {
      lastLoudAtRef.current = now;
      heardAnySoundRef.current = true;
    }
    if (
      lastLoudAtRef.current !== null &&
      now - lastLoudAtRef.current > SILENCE_TIMEOUT_MS
    ) {
      mediaRecorderRef.current?.stop();
      return;
    }

    rafRef.current = requestAnimationFrame(tickVolume);
  }

  async function transcribeAndInsert(blob: Blob) {
    setTranscribing(true);
    setStatus("idle");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("audio", blob, "voice-input.webm");

      const response = await fetch("/api/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? MIC_GENERIC_ERROR);
      }

      const transcript = typeof data.text === "string" ? data.text.trim() : "";
      const current = textRef.current;
      onTextChange(current.trim() ? `${current} ${transcript}` : transcript);
    } catch (error) {
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : MIC_GENERIC_ERROR);
    } finally {
      setTranscribing(false);
    }
  }

  function handleRecordingStopped(mimeType: string) {
    releaseRecordingResources();
    setRecording(false);

    const chunks = audioChunksRef.current;
    audioChunksRef.current = [];
    const startedAt = recordingStartRef.current;
    recordingStartRef.current = null;
    const durationMs = startedAt !== null ? performance.now() - startedAt : 0;

    // A recording this short is almost certainly an accidental tap, not an
    // attempt to say something — ignore it silently rather than showing an
    // error for something the user didn't really do.
    if (durationMs < MIN_RECORDING_MS) return;

    // Confirmed by testing: Gemini doesn't reliably return an empty
    // transcript for pure silence (it can hallucinate unrelated text
    // instead), so the server can't be trusted to catch "no speech" — check
    // client-side, using the same volume analysis that drove the pulse
    // ring, and skip the upload entirely.
    if (!heardAnySoundRef.current) {
      setStatus("error");
      setErrorMessage(MIC_NO_SPEECH_ERROR);
      return;
    }

    const blob = new Blob(chunks, { type: mimeType });
    void transcribeAndInsert(blob);
  }

  async function startRecording() {
    setStatus("idle");
    setErrorMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      recordingStreamRef.current = stream;

      const mimeType = CANDIDATE_MIME_TYPES.find(
        (type) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)
      );
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        handleRecordingStopped(mimeType ?? recorder.mimeType ?? "audio/webm");
      };

      mediaRecorderRef.current = recorder;
      heardAnySoundRef.current = false;
      recorder.start();
      recordingStartRef.current = performance.now();

      const ctx = new AudioContext();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      ctx.createMediaStreamSource(stream).connect(analyser);
      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      analyserDataRef.current = new Uint8Array(analyser.frequencyBinCount);
      lastLoudAtRef.current = null;
      setVolumeReactive(true);
      tickVolume();

      setRecording(true);
    } catch {
      setStatus("error");
      setErrorMessage(MIC_PERMISSION_ERROR);
    }
  }

  function handleToggleMic() {
    if (recording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    if (transcribing) return;
    void startRecording();
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

  const textareaPlaceholder = transcribing
    ? "Розпізнаю..."
    : recording && !text.trim()
      ? "Говори, я слухаю..."
      : "Пиши все підряд, ми в цьому розберемось...";

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
              placeholder={textareaPlaceholder}
              rows={5}
              className="rounded-input border-accent-border bg-accent-tint pr-12 text-base text-text-primary placeholder:text-text-tertiary"
              disabled={status === "loading"}
            />
            {micSupported && (
              <button
                type="button"
                onClick={handleToggleMic}
                disabled={status === "loading" || transcribing}
                aria-label={recording ? "Зупинити голосове введення" : "Голосове введення"}
                className={`absolute bottom-2 right-2 flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  recording || transcribing
                    ? "bg-accent text-white"
                    : "bg-transparent text-text-tertiary"
                }`}
              >
                {recording && (
                  <span
                    ref={ringRef}
                    className={`absolute inset-0 rounded-full bg-accent-tint ${
                      volumeReactive ? "" : "animate-mic-pulse-ring"
                    }`}
                  />
                )}
                {transcribing ? (
                  <span className="relative flex items-center gap-1">
                    <span
                      className="h-1 w-1 animate-dot-pulse rounded-full bg-current"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="h-1 w-1 animate-dot-pulse rounded-full bg-current"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="h-1 w-1 animate-dot-pulse rounded-full bg-current"
                      style={{ animationDelay: "300ms" }}
                    />
                  </span>
                ) : (
                  <Mic size={22} strokeWidth={2} className="relative" />
                )}
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
