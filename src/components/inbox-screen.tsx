"use client";

import { Calendar, Check, ChevronDown, Flag, Tag, X } from "lucide-react";
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

const PRIORITY_LABEL_TEXT: Record<Priority, string> = {
  high: "Високий",
  medium: "Середній",
  low: "Низький",
};

const PRIORITY_COLOR_CLASS: Record<Priority, string> = {
  high: "text-priority-high",
  medium: "text-priority-medium",
  low: "text-priority-low",
};

const LABEL_TEXT: Record<Label, string> = {
  work: "Робота",
  personal: "Особисте",
};

const LABEL_COLOR_CLASS: Record<Label, string> = {
  work: "text-label-work",
  personal: "text-label-personal",
};

const DEADLINE_LABEL_TEXT: Record<"today" | "tomorrow", string> = {
  today: "Сьогодні",
  tomorrow: "Завтра",
};

interface InboxScreenProps {
  tasks: ParsedTask[];
  onChangeTask: (index: number, patch: Partial<ParsedTask>) => void;
  onDeleteTask: (index: number) => void;
  onConfirm: () => void;
  onBack: () => void;
}

const TRIGGER_CLASS =
  "flex items-center gap-1.5 rounded-full border border-[#EDE6DD] bg-white px-3 py-2 text-sm font-medium text-text-primary transition-transform duration-120 active:scale-[0.97]";

const FIELD_LABEL_CLASS =
  "pl-0.5 text-[11px] font-semibold uppercase tracking-wide text-text-tertiary";

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
        {tasks.map((task, index) => {
          const deadlineValue: "today" | "tomorrow" =
            task.deadline === "tomorrow" ? "tomorrow" : "today";

          return (
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
                <button
                  type="button"
                  onClick={() => onDeleteTask(index)}
                  aria-label="Видалити задачу"
                  className="flex h-11 w-11 shrink-0 items-center justify-center"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EDE6DD] text-text-secondary">
                    <X size={16} strokeWidth={2} />
                  </span>
                </button>
              </div>

              <div className="flex flex-nowrap gap-2 overflow-x-auto pr-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <div className="flex shrink-0 flex-col gap-1">
                  <span className={FIELD_LABEL_CLASS}>Пріоритет</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className={TRIGGER_CLASS}>
                      <Flag
                        size={14}
                        fill="currentColor"
                        className={PRIORITY_COLOR_CLASS[task.priority]}
                      />
                      {PRIORITY_LABEL_TEXT[task.priority]}
                      <ChevronDown size={12} className="text-text-tertiary" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44">
                      {PRIORITY_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => onChangeTask(index, { priority: option.value })}
                        >
                          <Flag
                            size={15}
                            fill="currentColor"
                            className={PRIORITY_COLOR_CLASS[option.value]}
                          />
                          {option.label}
                          {task.priority === option.value && (
                            <Check size={14} className="ml-auto text-accent" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex shrink-0 flex-col gap-1">
                  <span className={FIELD_LABEL_CLASS}>Категорія</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className={TRIGGER_CLASS}>
                      <Tag size={14} className={LABEL_COLOR_CLASS[task.label]} />
                      {LABEL_TEXT[task.label]}
                      <ChevronDown size={12} className="text-text-tertiary" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44">
                      {LABEL_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => onChangeTask(index, { label: option.value })}
                        >
                          <Tag size={15} className={LABEL_COLOR_CLASS[option.value]} />
                          {option.label}
                          {task.label === option.value && (
                            <Check size={14} className="ml-auto text-accent" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex shrink-0 flex-col gap-1">
                  <span className={FIELD_LABEL_CLASS}>Дедлайн</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className={TRIGGER_CLASS}>
                      <Calendar size={14} className="text-text-secondary" />
                      {DEADLINE_LABEL_TEXT[deadlineValue]}
                      <ChevronDown size={12} className="text-text-tertiary" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-44">
                      {DEADLINE_OPTIONS.map((option) => (
                        <DropdownMenuItem
                          key={option.value}
                          onClick={() => onChangeTask(index, { deadline: option.value })}
                        >
                          <Calendar size={15} className="text-text-secondary" />
                          {option.label}
                          {deadlineValue === option.value && (
                            <Check size={14} className="ml-auto text-accent" />
                          )}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          );
        })}
      </main>

      <div className="fixed bottom-0 left-0 right-0 flex gap-2 bg-bg-base px-4 py-4">
        <button
          type="button"
          onClick={onBack}
          className="basis-[30%] shrink-0 grow-0 rounded-full border border-[#E3DCD3] py-3 text-base font-semibold text-text-primary transition-transform duration-150 active:scale-[0.98]"
        >
          Назад
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="basis-[70%] shrink-0 grow-0 rounded-full bg-accent py-3 text-base font-semibold text-white transition-transform duration-150 active:scale-[0.98] active:bg-accent-hover"
        >
          Додати задачі
        </button>
      </div>
    </div>
  );
}
