"use client";

import { MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

const DEADLINE_OPTIONS: { value: "today" | "tomorrow"; label: string }[] = [
  { value: "today", label: "Сьогодні" },
  { value: "tomorrow", label: "Завтра" },
];

interface InboxScreenProps {
  tasks: ParsedTask[];
  onChangeTask: (index: number, patch: Partial<ParsedTask>) => void;
  onDeleteTask: (index: number) => void;
  onConfirm: () => void;
  onBack: () => void;
}

function pillClass(selected: boolean): string {
  return `rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-150 ${
    selected
      ? "border border-accent bg-accent-tint text-accent"
      : "border border-transparent bg-[#F0EBE3] text-text-secondary hover:bg-accent-tint hover:text-accent"
  }`;
}

export function InboxScreen({
  tasks,
  onChangeTask,
  onDeleteTask,
  onConfirm,
  onBack,
}: InboxScreenProps) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      <header className="px-4 pt-8 pb-4">
        <h1 className="font-heading text-xl font-semibold tracking-tight text-text-primary">
          Ось що ми знайшли
        </h1>
      </header>

      <main className="flex-1 space-y-3 px-4 pb-28">
        {tasks.map((task, index) => (
          <div key={index} className="flex flex-col gap-3 rounded-card bg-surface p-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={task.title}
                onChange={(event) =>
                  onChangeTask(index, { title: event.target.value })
                }
                className="w-full flex-1 rounded-input border border-accent-border bg-accent-tint px-3 py-2 text-base text-text-primary"
              />
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Опції задачі"
                  className="shrink-0 rounded-full p-2 text-text-secondary hover:bg-[#F0EBE3]"
                >
                  <MoreVertical size={18} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDeleteTask(index)}
                  >
                    Видалити задачу
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRIORITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChangeTask(index, { priority: option.value })}
                  className={pillClass(task.priority === option.value)}
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
                  className={pillClass(task.label === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {DEADLINE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChangeTask(index, { deadline: option.value })}
                  className={pillClass(task.deadline === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </main>

      <div className="fixed bottom-0 left-0 right-0 flex gap-3 bg-bg-base px-4 py-4">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 rounded-full border border-[#E3DCD3] py-3 text-base font-semibold text-text-primary transition-transform duration-150 active:scale-[0.98]"
        >
          Назад
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded-full bg-accent py-3 text-base font-semibold text-white transition-transform duration-150 active:scale-[0.98] active:bg-accent-hover"
        >
          Додати все в Today
        </button>
      </div>
    </div>
  );
}
