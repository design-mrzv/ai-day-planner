"use client";

import { Undo2 } from "lucide-react";

interface UndoToastProps {
  onUndo: () => void;
}

export function UndoToast({ onUndo }: UndoToastProps) {
  return (
    <div aria-live="polite" className="animate-toast-in min-w-0 flex-1">
      <button
        type="button"
        onClick={onUndo}
        className="flex h-14 w-full flex-col items-start justify-center gap-0.5 rounded-[16px] bg-[#1C1815] px-4 text-left shadow-[0_14px_34px_rgba(28,24,21,0.28)]"
      >
        <span className="flex items-center gap-1.5 text-[15px] font-semibold text-[#F0A98A]">
          <Undo2 size={16} strokeWidth={2} />
          Скасувати
        </span>
        <span className="text-[13px] text-text-tertiary">Задачу виконано</span>
      </button>
    </div>
  );
}
