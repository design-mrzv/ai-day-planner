"use client";

import { Label, ParsedTask, Priority } from "@/lib/types";

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: "high", label: "Високий" },
  { value: "medium", label: "Середній" },
  { value: "low", label: "Низький" },
];

const LABEL_OPTIONS: { value: Label; label: string }[] = [
  { value: "work", label: "Робота" },
  { value: "personal", label: "Особисте" },
];

interface InboxScreenProps {
  tasks: ParsedTask[];
  onChangeTask: (index: number, patch: Partial<ParsedTask>) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export function InboxScreen({
  tasks,
  onChangeTask,
  onConfirm,
  onBack,
}: InboxScreenProps) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Ось що ми знайшли
        </h1>
      </header>

      <main className="flex-1 space-y-3 px-5 pb-28">
        {tasks.map((task, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <input
              type="text"
              value={task.title}
              onChange={(event) =>
                onChangeTask(index, { title: event.target.value })
              }
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-900"
            />

            <div className="flex flex-wrap gap-1.5">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChangeTask(index, { priority: option.value })}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    task.priority === option.value
                      ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {LABEL_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChangeTask(index, { label: option.value })}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    task.label === option.value
                      ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                      : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </main>

      <div className="fixed bottom-0 left-0 right-0 flex gap-3 bg-zinc-50 px-5 py-4 dark:bg-black">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-full border border-zinc-300 py-3 text-base font-medium text-zinc-900 dark:border-zinc-700 dark:text-zinc-50"
        >
          Назад
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-full bg-zinc-900 py-3 text-base font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
        >
          Додати все в Today
        </button>
      </div>
    </div>
  );
}
