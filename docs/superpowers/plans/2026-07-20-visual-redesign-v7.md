# Visual Redesign v7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 4 design-polish items from `DESIGN_SPEC_v7.md` (item 0, the time-loss bug report, was investigated and could not be reproduced on the current codebase — no code change for it in this plan; pending the user's own phone check).

**Architecture:** Four independent, mostly-isolated edits. Capture title spacing and Inbox button copy/proportions are pure styling touches. The delayed-completion behavior adds two small pieces of `Set<string>` state to `page.tsx` and one new boolean prop to `TaskCard`.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4.

## Global Constraints

- Item 0 (time-loss bug) is NOT fixed in this plan — investigated, not reproducible, deferred to the user's own phone verification.
- Total time from checkbox tap to a task actually leaving Today: ~1150ms (1000ms fully visible + 150ms fade), matching the spec's "~1.2 seconds."
- Colors/fonts/tokens/checkbox-as-priority/Inbox trigger+popover mechanics from v1-v6 — unchanged.

---

### Task 1: Capture title spacing + Inbox button copy/proportions

**Files:**
- Modify: `src/components/capture-sheet.tsx`
- Modify: `src/components/inbox-screen.tsx`

**Interfaces:** none — pure className/text changes, no prop or type changes.

- [ ] **Step 1: Add spacing under the Capture title**

In `src/components/capture-sheet.tsx`, change the `DrawerTitle`:
```tsx
<DrawerTitle className="mb-4 text-left font-sans text-[17px] font-semibold leading-6">
  Що в голові?
</DrawerTitle>
```

- [ ] **Step 2: Update the Inbox button row's copy and proportions**

In `src/components/inbox-screen.tsx`, replace the bottom action bar:
```tsx
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
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Manually verify**

```bash
npm run dev
```

1. Open Capture — confirm a visible ~16px gap between "Що в голові?" and the textarea (not flush).
2. Enable Inbox, submit text, confirm the bottom row reads "Назад" / "Додати задачі", with "Додати задачі" visibly wider than "Назад" (roughly 70/30, not an even split).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Add Capture title spacing, rename and resize Inbox action buttons

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Tabular-nums reinforcement + delayed card removal on completion

**Files:**
- Modify: `src/components/task-card.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- `TaskCard` gains a new optional prop `fading?: boolean` (default `false`) — when `true`, the card renders at `opacity-0` with its existing transition covering `opacity` in addition to `transform`.
- `page.tsx`'s `handleComplete(id: string)` behavior changes: the task now stays visible for ~1150ms before actually leaving `visibleTasks`, instead of disappearing instantly. `handleUndo` signature and behavior are unchanged.

- [ ] **Step 1: Reinforce tabular-nums and add the `fading` prop to `TaskCard`**

`src/components/task-card.tsx`:
```tsx
"use client";

import { useState } from "react";
import { Calendar, Clock, Hash } from "lucide-react";
import { Task } from "@/lib/types";

const PRIORITY_LABEL: Record<Task["priority"], string> = {
  high: "Високий пріоритет",
  medium: "Середній пріоритет",
  low: "Низький пріоритет",
};

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

const TABULAR_NUMS_STYLE = {
  fontVariantNumeric: "tabular-nums",
  fontFeatureSettings: '"tnum" 1, "lnum" 1',
  letterSpacing: 0,
} as const;

function formatDeadline(deadline: Task["deadline"]): string | null {
  if (!deadline || deadline === "today" || deadline === "tomorrow") return null;
  return deadline;
}

interface TaskCardProps {
  task: Task;
  onToggleDone: (id: string) => void;
  animationDelayMs?: number;
  fading?: boolean;
}

export function TaskCard({
  task,
  onToggleDone,
  animationDelayMs = 0,
  fading = false,
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
      className={`animate-card-in flex items-start gap-2.5 rounded-card bg-surface p-[14px_16px] transition-[transform,opacity] duration-150 active:scale-[0.99] ${
        fading ? "opacity-0" : "opacity-100"
      }`}
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
            <span className="flex items-center gap-1" style={TABULAR_NUMS_STYLE}>
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
```

- [ ] **Step 2: Add delayed-removal state and wire `fading` into `page.tsx`**

`src/app/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { Plus, Settings as SettingsIcon } from "lucide-react";
import { TaskCard } from "@/components/task-card";
import { CaptureSheet } from "@/components/capture-sheet";
import { WelcomeScreen } from "@/components/welcome-screen";
import { SettingsScreen } from "@/components/settings-screen";
import { InboxScreen } from "@/components/inbox-screen";
import { UndoToast } from "@/components/undo-toast";
import {
  loadInboxEnabled,
  loadOnboardingDone,
  loadTasks,
  saveInboxEnabled,
  saveOnboardingDone,
  saveTasks,
} from "@/lib/storage";
import { sortTasks } from "@/lib/sort-tasks";
import { ParsedTask, Task } from "@/lib/types";

type Screen = "today" | "settings" | "inbox";

interface UndoState {
  task: Task;
  timeoutId: ReturnType<typeof setTimeout>;
}

const STAGGER_STEP_MS = 40;
const COMPLETE_VISIBLE_MS = 1000;
const COMPLETE_FADE_MS = 150;

function toTask(parsed: ParsedTask, uniqueSuffix: string): Task {
  return { ...parsed, id: `${Date.now()}-${uniqueSuffix}`, done: false };
}

function withId(ids: Set<string>, id: string): Set<string> {
  return new Set(ids).add(id);
}

function withoutId(ids: Set<string>, id: string): Set<string> {
  const next = new Set(ids);
  next.delete(id);
  return next;
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [inboxEnabled, setInboxEnabled] = useState<boolean | null>(null);
  const [screen, setScreen] = useState<Screen>("today");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [captureText, setCaptureText] = useState("");
  const [pendingInboxTasks, setPendingInboxTasks] = useState<ParsedTask[] | null>(
    null
  );
  const [undoState, setUndoState] = useState<UndoState | null>(null);
  const [completingIds, setCompletingIds] = useState<Set<string>>(new Set());
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());

  // localStorage isn't available during SSR, so hydrating from it must
  // happen in an effect rather than a useState initializer.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setTasks(loadTasks());
    setOnboardingDone(loadOnboardingDone());
    setInboxEnabled(loadInboxEnabled());
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (tasks !== null) {
      saveTasks(tasks);
    }
  }, [tasks]);

  function handleComplete(id: string) {
    const target = (tasks ?? []).find((task) => task.id === id);
    if (!target) return;

    setTasks((prev) =>
      (prev ?? []).map((task) => (task.id === id ? { ...task, done: true } : task))
    );
    setCompletingIds((prev) => withId(prev, id));

    setTimeout(() => {
      setFadingIds((prev) => withId(prev, id));
    }, COMPLETE_VISIBLE_MS);

    setTimeout(() => {
      setCompletingIds((prev) => withoutId(prev, id));
      setFadingIds((prev) => withoutId(prev, id));

      setUndoState((prevUndo) => {
        if (prevUndo) clearTimeout(prevUndo.timeoutId);
        const timeoutId = setTimeout(() => setUndoState(null), 4000);
        return { task: target, timeoutId };
      });
    }, COMPLETE_VISIBLE_MS + COMPLETE_FADE_MS);
  }

  function handleUndo() {
    setUndoState((prev) => {
      if (!prev) return prev;
      clearTimeout(prev.timeoutId);
      const taskId = prev.task.id;
      setTasks((tasksPrev) =>
        (tasksPrev ?? []).map((task) =>
          task.id === taskId ? { ...task, done: false } : task
        )
      );
      return null;
    });
  }

  function handleParsed(parsedTasks: ParsedTask[]) {
    setSheetOpen(false);

    if (inboxEnabled) {
      setPendingInboxTasks(parsedTasks);
      setScreen("inbox");
      return;
    }

    setTasks((prev) => [
      ...(prev ?? []),
      ...parsedTasks.map((parsed, index) => toTask(parsed, String(index))),
    ]);
    setCaptureText("");
  }

  function handleChangeInboxTask(index: number, patch: Partial<ParsedTask>) {
    setPendingInboxTasks((prev) =>
      (prev ?? []).map((task, i) => (i === index ? { ...task, ...patch } : task))
    );
  }

  function handleDeleteInboxTask(index: number) {
    setPendingInboxTasks((prev) => (prev ?? []).filter((_, i) => i !== index));
  }

  function handleConfirmInbox() {
    setTasks((prev) => [
      ...(prev ?? []),
      ...(pendingInboxTasks ?? []).map((parsed, index) =>
        toTask(parsed, String(index))
      ),
    ]);
    setCaptureText("");
    setPendingInboxTasks(null);
    setScreen("today");
  }

  function handleBackFromInbox() {
    setPendingInboxTasks(null);
    setScreen("today");
    setSheetOpen(true);
  }

  function handleToggleInboxSetting(value: boolean) {
    saveInboxEnabled(value);
    setInboxEnabled(value);
  }

  if (tasks === null || onboardingDone === null || inboxEnabled === null) {
    return null;
  }

  if (!onboardingDone) {
    return (
      <WelcomeScreen
        onStart={() => {
          saveOnboardingDone();
          setOnboardingDone(true);
        }}
      />
    );
  }

  if (screen === "settings") {
    return (
      <SettingsScreen
        inboxEnabled={inboxEnabled}
        onToggleInbox={handleToggleInboxSetting}
        onBack={() => setScreen("today")}
      />
    );
  }

  if (screen === "inbox" && pendingInboxTasks) {
    return (
      <InboxScreen
        tasks={pendingInboxTasks}
        onChangeTask={handleChangeInboxTask}
        onDeleteTask={handleDeleteInboxTask}
        onConfirm={handleConfirmInbox}
        onBack={handleBackFromInbox}
      />
    );
  }

  const visibleTasks = sortTasks(
    tasks.filter((task) => !task.done || completingIds.has(task.id))
  );
  const todayTasks = visibleTasks.filter((task) => task.deadline !== "tomorrow");
  const tomorrowTasks = visibleTasks.filter((task) => task.deadline === "tomorrow");

  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      <header className="flex items-center justify-between px-4 pt-8 pb-4">
        <h1 className="font-heading text-[32px] leading-9 font-bold tracking-tight text-text-primary">
          Сьогодні
        </h1>
        <button
          type="button"
          onClick={() => setScreen("settings")}
          aria-label="Налаштування"
          className="text-text-secondary transition-transform duration-150 active:scale-95"
        >
          <SettingsIcon size={22} />
        </button>
      </header>

      <main className="flex-1 px-4 pb-28">
        {visibleTasks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-24 text-center">
            <span className="text-4xl">📝</span>
            <p className="max-w-xs text-text-secondary">
              Що плануєш сьогодні? Натисни + і розкажи все що в голові
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3">
              {todayTasks.map((task, index) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggleDone={handleComplete}
                  animationDelayMs={index * STAGGER_STEP_MS}
                  fading={fadingIds.has(task.id)}
                />
              ))}
            </div>
            {tomorrowTasks.length > 0 && (
              <>
                <h2 className="mt-6 mb-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                  Завтра
                </h2>
                <div className="flex flex-col gap-3">
                  {tomorrowTasks.map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onToggleDone={handleComplete}
                      animationDelayMs={(todayTasks.length + index) * STAGGER_STEP_MS}
                      fading={fadingIds.has(task.id)}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>

      <div className="fixed bottom-6 right-4">
        {visibleTasks.length === 0 && (
          <span className="animate-pulse-ring absolute inset-0 rounded-full bg-accent-tint" />
        )}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_10px_24px_rgba(181,80,47,0.35)] transition-transform duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95"
          aria-label="Додати задачі"
        >
          <Plus strokeWidth={2} size={26} />
        </button>
      </div>

      {undoState && <UndoToast onUndo={handleUndo} />}

      <CaptureSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        text={captureText}
        onTextChange={setCaptureText}
        onParsed={handleParsed}
      />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Manually verify**

```bash
npm run dev
```

1. Devtools → inspect a task's time span → confirm `font-feature-settings: "tnum" 1, "lnum" 1` is applied.
2. Tap a Today checkbox — confirm the checkbox fills and the title strikes through immediately, the card stays fully visible and tappable (e.g. still expands its description on tap) for about 1 second, then fades out over ~150ms (not an instant cut), then the undo toast appears.
3. Tap "Скасувати" while the card is still in its 1-second visible window (before it starts fading) — confirm the task reverts correctly (checkbox unfills, strikethrough removed) and stays in the list.
4. Complete two different tasks within the ~1.15s window of each other — confirm both eventually disappear correctly and only one undo toast is active at a time (second replaces first, per existing behavior).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Reinforce tabular-nums for time, delay Today card removal on completion

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Push, deploy, and verify live

**Files:** none (operational task).

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

Confirm in the Vercel dashboard that the deployment reaches **Ready**.

- [ ] **Step 2: Verify on the live URL**

Open the live Vercel URL and repeat Task 1 Step 4 and Task 2 Step 4's scenarios (1, 2, 3 at minimum) on the live deploy. Also re-attempt the item-0 bug repro (time through Inbox) one more time on the live deploy, on the actual phone if possible, since the user is doing their own final check for that item.
