# Visual Redesign v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the 5 designer-flagged v3 fixes: remove Capture's redundant hint line, fix error message color/position, replace the priority dot+letter with a colored checkbox border, unify FAB/Settings icon stroke weight, and bump two tap targets to 44×44px.

**Architecture:** Small, self-contained edits to 3 already-existing files (`capture-sheet.tsx`, `task-card.tsx`, `page.tsx`, `inbox-screen.tsx`) — no new files, no new dependencies beyond an already-installed lucide-react icon (`Plus`).

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, lucide-react.

## Global Constraints

- Reuse the existing `--color-priority-high`/`--color-priority-medium` tokens for checkbox border/accent — do not invent new tokens for values that already exist.
- Low-priority checkbox border is `#D4D4D8` — an explicit one-off value, NOT the existing `--color-priority-low` (#A39B92) token. This is intentional per the designer's spec (a cooler, more neutral gray specifically for this UI element).
- Settings toggle tap target: no code change — the full-row `<label>` already exceeds 44×44px via native label click semantics.
- No automated tests — manual verification, consistent with all prior phases.

---

### Task 1: All 5 v3 fixes

**Files:**
- Modify: `src/components/capture-sheet.tsx`
- Modify: `src/components/task-card.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/components/inbox-screen.tsx`

**Interfaces:** No prop/type signature changes to any component — all changes are internal JSX/className edits.

- [ ] **Step 1: Capture sheet — remove hint, fix error color/position**

In `src/components/capture-sheet.tsx`, remove the hint paragraph and update the error paragraph:
```tsx
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            placeholder="Пиши все підряд, ми в цьому розберемось..."
            rows={5}
            className="rounded-input border-accent-border bg-accent-tint text-base text-text-primary placeholder:text-text-tertiary"
            disabled={status === "loading"}
          />
          {status === "error" && (
            // Parent's `gap-3` already adds 12px above this element;
            // -mt-1 (-4px) nets exactly the 8px the design spec calls for.
            <p className="-mt-1 text-sm text-priority-high">{errorMessage}</p>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={text.trim().length === 0 || status === "loading"}
            className="rounded-input font-semibold transition-transform duration-150 active:scale-[0.98] active:bg-accent-hover"
          >
            {status === "loading" ? "Ми будуємо твій план..." : "Обробити"}
          </Button>
```
(The `<p className="text-sm text-text-tertiary">AI визначить пріоритет, час і категорію сам</p>` line that used to sit between the Textarea and the error check is deleted entirely — not replaced.)

- [ ] **Step 2: TaskCard — checkbox border color instead of priority dot**

In `src/components/task-card.tsx`, replace the `PRIORITY_COLOR`/`PRIORITY_SHORT` constants and the card's opening markup:
```tsx
"use client";

import { useState } from "react";
import { Task } from "@/lib/types";

const PRIORITY_LABEL: Record<Task["priority"], string> = {
  high: "Високий пріоритет",
  medium: "Середній пріоритет",
  low: "Низький пріоритет",
};

const PRIORITY_CHECKBOX: Record<Task["priority"], string> = {
  high: "border-priority-high accent-priority-high",
  medium: "border-priority-medium accent-priority-medium",
  low: "border-[#D4D4D8] accent-[#D4D4D8]",
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
      <span className="-m-3 flex shrink-0 items-center p-3">
        <input
          type="checkbox"
          checked={task.done}
          onChange={handleCheck}
          aria-label={`${PRIORITY_LABEL[task.priority]}, ${task.done ? "виконано" : "не виконано"}`}
          className={`h-[22px] w-[22px] rounded-checkbox border-2 ${PRIORITY_CHECKBOX[task.priority]} ${
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
```
(The old `<span aria-label=... className="... rounded-full ...">{PRIORITY_SHORT[...]}</span>` dot element is gone; the checkbox `<span>` wrapper's padding also grows from `p-2.5`/`-m-2.5` to `p-3`/`-m-3` per Step 5's tap-target requirement — bundled here since it's the same element this step already touches.)

- [ ] **Step 3: FAB icon — swap text glyph for a stroke-matched lucide icon**

In `src/app/page.tsx`, add the import and swap the FAB's `+` text for `<Plus>`:
```tsx
import { Plus, Settings as SettingsIcon } from "lucide-react";
```
```tsx
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-[0_10px_24px_rgba(181,80,47,0.35)] transition-transform duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95"
          aria-label="Додати задачі"
        >
          <Plus strokeWidth={2} size={26} />
        </button>
```
(Note the `text-2xl` class is removed from the button — it was only sizing the old text glyph and has no effect on the new icon.)

- [ ] **Step 4: Inbox "⋮" — 44×44px tap target**

In `src/components/inbox-screen.tsx`, update the `DropdownMenuTrigger`:
```tsx
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Опції задачі"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-[#F0EBE3]"
                >
                  <MoreVertical size={18} />
                </DropdownMenuTrigger>
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: succeeds, no unused-variable lint errors (confirm `PRIORITY_COLOR`/`PRIORITY_SHORT` aren't referenced anywhere else — they were only used inside `task-card.tsx`).

- [ ] **Step 6: Manually verify all 5 fixes**

```bash
npm run dev
```

1. Open Capture, submit meaningless text — confirm the error appears directly under the textarea (no hint line above it), in the priority-high red, with a visibly tighter gap than the textarea-to-button gap used to be.
2. Today: confirm each task's checkbox has a colored border matching its priority (red/amber/light-gray), no separate dot+letter circle. Tap one — confirm it fills with that same color and shows a white checkmark.
3. In Chrome DevTools, inspect a checkbox's Accessibility properties — confirm the `aria-label` reads e.g. "Високий пріоритет, не виконано".
4. Visually compare the FAB "+" and the Settings gear — same line weight now.
5. On a real phone or devtools device toolbar, confirm the checkbox and Inbox "⋮" button are comfortably tappable beyond their visible edges.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
v3: remove Capture hint, checkbox-border priority, icon consistency, tap targets

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Push and verify on the live deploy

**Files:** none (operational task).

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

Confirm in the Vercel dashboard that the deployment reaches **Ready**.

- [ ] **Step 2: Verify on the live URL**

Open the live Vercel URL and repeat Task 1 Step 6's checks 1, 2, and 4 (the visual/color ones) — confirm no regressions from the v2 redesign baseline.
