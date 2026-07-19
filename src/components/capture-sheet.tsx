"use client";

import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ParsedTask } from "@/lib/types";

interface CaptureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: string;
  onTextChange: (text: string) => void;
  onParsed: (tasks: ParsedTask[]) => void;
}

const OPENING_GUARD_MS = 300;

export function CaptureSheet({
  open,
  onOpenChange,
  text,
  onTextChange,
  onParsed,
}: CaptureSheetProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsOpening(true);
    const timeoutId = setTimeout(() => setIsOpening(false), OPENING_GUARD_MS);
    return () => clearTimeout(timeoutId);
  }, [open]);

  async function handleSubmit() {
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Не вдалося обробити, спробуй ще раз");
      }

      setStatus("idle");
      onParsed(data.tasks as ParsedTask[]);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Не вдалося обробити, спробуй ще раз"
      );
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} disablePointerDismissal={isOpening}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Що в голові?</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-3 px-4 pb-6">
          <Textarea
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            placeholder="Що в голові?..."
            rows={5}
            className="text-base"
            disabled={status === "loading"}
          />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Пиши все підряд, ми в цьому розберемось
          </p>
          {status === "error" && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={text.trim().length === 0 || status === "loading"}
          >
            {status === "loading" ? "Ми будуємо твій план..." : "Обробити"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
