"use client";

import { useState } from "react";
import { Task } from "@/lib/types";

const PRIORITY_COLOR: Record<Task["priority"], string> = {
  high: "bg-priority-high",
  medium: "bg-priority-medium",
  low: "bg-priority-low",
};

const PRIORITY_LABEL: Record<Task["priority"], string> = {
  high: "Високий пріоритет",
  medium: "Середній пріоритет",
  low: "Низький пріоритет",
};

const PRIORITY_SHORT: Record<Task["priority"], string> = {
  high: "В",
  medium: "С",
  low: "Н",
};

const LABEL_STYLE: Record<Task["label"], string> = {
  work: "bg-label-work-bg text-label-work",
  personal: "bg-label-personal-bg text-label-personal",
};

const LABEL_TEXT: Record<Task["label"], string> = {
  work: "Робота",
  personal: "Особисте",
};

function formatDeadline(deadline: Task["deadline"]): string | null {
  if (!deadline || deadline === "today") return null;
  if (deadline === "tomorrow") return "Завтра";
  return deadline;
}

interface TaskCardProps {
  task: Task;
  onToggleDone: (id: string) => void;
}

export function TaskCard({ task, onToggleDone }: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const deadlineLabel = formatDeadline(task.deadline);

  return (
    <div className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <span
        aria-label={PRIORITY_LABEL[task.priority]}
        className={`mt-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white ${PRIORITY_COLOR[task.priority]}`}
      >
        {PRIORITY_SHORT[task.priority]}
      </span>
      <span className="-m-3 flex shrink-0 items-center p-3">
        <input
          type="checkbox"
          checked={task.done}
          onChange={() => onToggleDone(task.id)}
          className="h-5 w-5 rounded border-zinc-300"
        />
      </span>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex flex-1 flex-col items-start gap-1.5 text-left"
      >
        <div className="flex w-full items-center justify-between gap-2">
          <span
            className={`text-base font-medium text-zinc-900 dark:text-zinc-50 ${
              task.done ? "line-through opacity-50" : ""
            }`}
          >
            {task.title}
          </span>
          {task.time && (
            <span className="shrink-0 text-sm text-zinc-600 dark:text-zinc-400">
              {task.time}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span
            className={`rounded-full px-2 py-0.5 font-medium ${LABEL_STYLE[task.label]}`}
          >
            {LABEL_TEXT[task.label]}
          </span>
          {deadlineLabel && (
            <span className="text-zinc-600 dark:text-zinc-400">{deadlineLabel}</span>
          )}
        </div>
        {expanded && task.description && (
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            {task.description}
          </p>
        )}
      </button>
    </div>
  );
}
