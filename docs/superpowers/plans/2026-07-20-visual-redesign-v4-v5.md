# Visual Redesign v4+v5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the date under "Сьогодні", restyle the Capture sheet title, replace the task card's label-pill/right-aligned-time with an icon-based meta-row, unify "Обробити"/"Почати" into one button style, and group Today into "Сьогодні"/"Завтра" sections — all per `DESIGN_SPEC_v4.md` + `DESIGN_SPEC_v5.md`.

**Architecture:** Pure presentational changes to four existing components (`page.tsx`, `task-card.tsx`, `capture-sheet.tsx`, `welcome-screen.tsx`). No new files, no state-shape changes, no new dependencies beyond three already-available `lucide-react` icons.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, `lucide-react` (already a dependency).

## Global Constraints

- No new screen, route, or navigation state for Today/Tomorrow — explicitly ruled out by v5 given the deadline. Grouping is pure array filtering + one conditional header inside the existing Today render.
- The "Завтра" tag that used to appear on individual task cards is removed — section grouping now conveys it. The meta-row's calendar icon only shows for a deadline that's neither `"today"` nor `"tomorrow"` (a specific `YYYY-MM-DD` string).
- Icons: `lucide-react`, `size={14}`, `strokeWidth={2}` — matches the FAB/Settings stroke weight from v3.
- Button style (`h-14 w-full rounded-input px-6 py-4 text-base font-semibold`) is applied as inline Tailwind classes in each of the two places it's used — no new shared `Button` component, consistent with the project's earlier explicit decision against UI abstractions.
- No automated tests — manual verification per step, consistent with all prior phases.

---

### Task 1: Task card meta-row (icons, no pill, reordered)

**Files:**
- Modify: `src/components/task-card.tsx`

**Interfaces:**
- Consumes: `Task` from `@/lib/types` (unchanged).
- Produces: `TaskCard` component — same props `{ task: Task; onToggleDone: (id: string) => void; animationDelayMs?: number }`, no signature change. Task 2 renders `TaskCard` the same way it already does.

- [ ] **Step 1: Rewrite the component**

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
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: succeeds.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Replace TaskCard label pill/right-aligned time with icon meta-row

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Today/Tomorrow grouping, remove date under H1

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `TaskCard` (Task 1, same props); `sortTasks` from `@/lib/sort-tasks` (unchanged); everything else from `page.tsx`'s existing imports (unchanged).
- Produces: no new exports — top-level page component.

- [ ] **Step 1: Remove the date line and unused `todayLabel` helper, add grouping**

In `src/app/page.tsx`:

Remove this function entirely (it becomes unused):
```tsx
function todayLabel(): string {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
  }).format(new Date());
}
```

Replace the `const visibleTasks = ...` line through the closing `</main>` with:
```tsx
  const visibleTasks = sortTasks(tasks.filter((task) => !task.done));
  const todayTasks = visibleTasks.filter((task) => task.deadline !== "tomorrow");
  const tomorrowTasks = visibleTasks.filter((task) => task.deadline === "tomorrow");

  return (
    <div className="flex min-h-screen flex-col bg-bg-base">
      <header className="flex items-center justify-between px-4 pt-8 pb-4">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-text-primary">
          Сьогодні
        </h1>
        <button
          type="button"
          onClick={() => setScreen("settings")}
          aria-label="Settings"
          className="text-text-secondary"
        >
          <SettingsIcon size={24} />
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
                  animationDelayMs={index * 40}
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
                      animationDelayMs={(todayTasks.length + index) * 40}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
```

Note: this replaces the previous header markup (which wrapped the H1 and a date `<p>` in a nested `<div>`) with a flat `<h1>` directly inside the `flex items-center justify-between` header — there's no longer a two-line block on the left needing `items-start`.

The rest of the file (FAB button, `{undoState && <UndoToast .../>}`, `<CaptureSheet .../>`, closing `</div>`) is unchanged — leave it as-is below `</main>`.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Manually verify grouping**

```bash
npm run dev
```

1. With only same-day tasks: confirm no "Завтра" header appears anywhere.
2. Add a task via Capture with deadline tomorrow (e.g. "Завтра здати звіт") — confirm it appears under a "Завтра" header, separated from the main list, and the header is small/uppercase/secondary-colored.
3. Confirm the H1 says "Сьогодні" with no date line underneath.
4. Reload with a mix of today+tomorrow tasks — confirm cards still stagger in on load as one continuous sequence (tomorrow-section cards start their delay where the today-section cards left off, not all at 0ms).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Group Today into Сьогодні/Завтра sections, remove date under H1

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Capture sheet title style + unified button style

**Files:**
- Modify: `src/components/capture-sheet.tsx`
- Modify: `src/components/welcome-screen.tsx`

**Interfaces:** none — internal styling only, no prop/type changes to either component.

- [ ] **Step 1: Restyle the Capture sheet title and "Обробити" button**

In `src/components/capture-sheet.tsx`, change the `DrawerTitle`:
```tsx
<DrawerTitle className="text-left font-sans text-[17px] font-semibold leading-6">
  Що в голові?
</DrawerTitle>
```

And change the `Button`:
```tsx
<Button
  type="button"
  onClick={handleSubmit}
  disabled={text.trim().length === 0 || status === "loading"}
  className="h-14 w-full rounded-input px-6 py-4 text-base font-semibold transition-transform duration-150 active:scale-[0.98] active:bg-accent-hover"
>
  {status === "loading" ? "Ми будуємо твій план..." : "Обробити"}
</Button>
```

- [ ] **Step 2: Restyle the Welcome "Почати" button**

`src/components/welcome-screen.tsx`:
```tsx
"use client";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-base px-8 text-center">
      <h1 className="font-heading text-4xl font-bold tracking-tight text-text-primary">
        AI Day Planner
      </h1>
      <p className="max-w-xs text-lg text-text-secondary">
        Розкажи все, що в голові. Ми складемо план на день
      </p>
      <button
        type="button"
        onClick={onStart}
        className="h-14 w-full max-w-xs rounded-input bg-accent px-6 py-4 text-base font-semibold text-white transition-transform duration-150 active:scale-[0.98] active:bg-accent-hover"
      >
        Почати
      </button>
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

1. Open Capture — confirm "Що в голові?" is left-aligned, visibly a smaller/lighter weight than the "Сьогодні" H1 (Manrope vs Unbounded), and "Обробити" spans the full sheet width at a taller height than before.
2. Clear onboarding (`localStorage.clear()`), reload — confirm the Welcome screen's "Почати" button is now a full-width rectangular button (same height/radius as "Обробити"), not a small centered pill.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Unify Capture/Welcome button style, restyle Capture sheet title

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Push and verify on the live deploy

**Files:** none (operational task).

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

Confirm in the Vercel dashboard that the deployment reaches **Ready**.

- [ ] **Step 2: Full manual verification on the live URL**

Open the live Vercel URL and repeat Task 2 Step 3 (grouping) and Task 3 Step 4 (title/button style) on the deployed site. Also spot-check that existing functionality didn't regress: Capture → Today flow, checkbox priority-border colors (v3), soft-complete/undo toast, Settings/Inbox screens still render with the new fonts/colors from v2.
