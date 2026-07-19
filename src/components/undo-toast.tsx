"use client";

interface UndoToastProps {
  onUndo: () => void;
}

export function UndoToast({ onUndo }: UndoToastProps) {
  return (
    <div
      aria-live="polite"
      className="fixed inset-x-4 bottom-24 z-40 rounded-2xl bg-zinc-900 px-4 py-3 text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-900"
    >
      <button type="button" onClick={onUndo} className="block text-base font-bold">
        Скасувати
      </button>
      <p className="text-sm text-zinc-300 dark:text-zinc-600">Виконано</p>
    </div>
  );
}
