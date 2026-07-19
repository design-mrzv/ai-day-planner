"use client";

interface UndoToastProps {
  onUndo: () => void;
}

export function UndoToast({ onUndo }: UndoToastProps) {
  return (
    <div
      aria-live="polite"
      className="animate-toast-in fixed inset-x-4 bottom-24 z-40 rounded-card bg-[#1C1815] px-4 py-3 shadow-[0_14px_34px_rgba(28,24,21,0.28)]"
    >
      <button
        type="button"
        onClick={onUndo}
        className="block text-base font-bold text-[#F0A98A]"
      >
        Скасувати
      </button>
      <p className="text-sm text-[#B0A79E]">Виконано</p>
    </div>
  );
}
