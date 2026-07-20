"use client";

import { useState } from "react";
import { Calendar, Clock, Hash } from "lucide-react";
import { Task } from "@/lib/types";

const PRIORITY_LABEL: Record<Task["priority"], string> = {
  high: "Високий пріоритет",
  medium: "Середній пріоритет",
  low: "Низький пріоритет",
};

// Native checkboxes (`appearance: auto`) ignore author `border-color` in most
// browsers — only `accent-color` (the checked fill) is respected. So this is
// `appearance-none` with the checked state (background + checkmark) drawn
// entirely in CSS, not relying on native rendering for either state.
const PRIORITY_CHECKBOX: Record<Task["priority"], string> = {
  high: "border-priority-high checked:border-priority-high checked:bg-priority-high",
  medium: "border-priority-medium checked:border-priority-medium checked:bg-priority-medium",
  low: "border-[#D4D4D8] checked:border-[#D4D4D8] checked:bg-[#D4D4D8]",
};

const CHECKMARK_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='none' stroke='white' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 8l3.5 3.5L13 5'/%3E%3C/svg%3E\")";

const LABEL_TEXT_COLOR: Record<Task["label"], string> = {
  work: "text-label-work",
  personal: "text-label-personal",
};

const LABEL_TEXT: Record<Task["label"], string> = {
  work: "Робота",
  personal: "Особисте",
};

// Grouping into "Сьогодні"/"Завтра" sections (page.tsx) already conveys
// today/tomorrow, so the meta row only needs a deadline badge when it's
// neither — an AI-parsed specific YYYY-MM-DD date.
function formatDeadline(deadline: Task["deadline"]): string | null {
  if (!deadline || deadline === "today" || deadline === "tomorrow") return null;
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
      <span className="-m-3 flex shrink-0 items-center p-3">
        <input
          type="checkbox"
          checked={task.done}
          onChange={handleCheck}
          aria-label={`${PRIORITY_LABEL[task.priority]}, ${task.done ? "виконано" : "не виконано"}`}
          style={{ backgroundImage: task.done ? CHECKMARK_URL : undefined }}
          className={`h-[22px] w-[22px] cursor-pointer appearance-none rounded-checkbox border-2 bg-center bg-no-repeat bg-[length:12px] ${PRIORITY_CHECKBOX[task.priority]} ${
            justChecked ? "animate-checkbox-pop" : ""
          }`}
        />
      </span>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex flex-1 flex-col items-start gap-[7px] text-left"
      >
        <span
          className={`text-base font-semibold text-text-primary ${
            task.done ? "line-through opacity-50" : ""
          }`}
        >
          {task.title}
        </span>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-text-secondary">
          {deadlineLabel && (
            <span className="flex items-center gap-1">
              <Calendar size={14} strokeWidth={2} />
              {deadlineLabel}
            </span>
          )}
          {task.time && (
            <span className="flex items-center gap-1 tabular-nums">
              <Clock size={14} strokeWidth={2} />
              {task.time}
            </span>
          )}
          <span className={`flex items-center gap-1 ${LABEL_TEXT_COLOR[task.label]}`}>
            <Hash size={14} strokeWidth={2} />
            {LABEL_TEXT[task.label]}
          </span>
        </div>
        {expanded && task.description && (
          <p className="mt-1 text-sm text-text-secondary">{task.description}</p>
        )}
      </button>
    </div>
  );
}
