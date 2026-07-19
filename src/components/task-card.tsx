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
  animationDelayMs?: number;
}

export function TaskCard({
  task,
  onToggleDone,
  animationDelayMs = 0,
}: TaskCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [justChecked, setJustChecked] = useState(false);
  const deadlineLabel = formatDeadline(task.deadline);

  function handleCheck() {
    setJustChecked(true);
    onToggleDone(task.id);
  }

  return (
    <div
      className="animate-card-in flex items-start gap-2.5 rounded-card bg-surface p-[14px_16px] transition-transform duration-120 active:scale-[0.99]"
      style={{ animationDelay: `${animationDelayMs}ms` }}
    >
      <span
        aria-label={PRIORITY_LABEL[task.priority]}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white ${PRIORITY_COLOR[task.priority]}`}
      >
        {PRIORITY_SHORT[task.priority]}
      </span>
      <span className="-m-2.5 flex shrink-0 items-center p-2.5">
        <input
          type="checkbox"
          checked={task.done}
          onChange={handleCheck}
          className={`h-[22px] w-[22px] rounded-checkbox border-2 border-[#E3DCD3] accent-accent ${
            justChecked ? "animate-checkbox-pop" : ""
          }`}
        />
      </span>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex flex-1 flex-col items-start gap-[7px] text-left"
      >
        <div className="flex w-full items-baseline justify-between gap-2">
          <span
            className={`text-base font-semibold text-text-primary ${
              task.done ? "line-through opacity-50" : ""
            }`}
          >
            {task.title}
          </span>
          {task.time && (
            <span className="shrink-0 text-sm font-medium tabular-nums text-text-secondary">
              {task.time}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span
            className={`rounded-full px-2.5 py-[3px] font-semibold ${LABEL_STYLE[task.label]}`}
          >
            {LABEL_TEXT[task.label]}
          </span>
          {deadlineLabel && (
            <span className="font-semibold text-text-tertiary">{deadlineLabel}</span>
          )}
        </div>
        {expanded && task.description && (
          <p className="mt-1 text-sm text-text-secondary">{task.description}</p>
        )}
      </button>
    </div>
  );
}
