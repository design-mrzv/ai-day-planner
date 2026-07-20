# Visual Redesign v6: Inbox Trigger+Popover Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Inbox's three always-visible pill rows with a horizontally-scrolling row of three trigger+popover controls (Priority, Category, Deadline), and swap the "⋮" delete dropdown for a plain "✕" button — matching `DESIGN_SPEC_v6.md` and its working prototype.

**Architecture:** Single-file rewrite of `src/components/inbox-screen.tsx`. Reuses the existing shadcn `DropdownMenu` (already in the project from the post-audit Inbox-delete feature) for the popover mechanics instead of hand-rolled open/close JS — it already portals content (avoids clipping by the new `overflow-x-auto` row), auto-flips on collision, and closes on outside click. `onChangeTask`/`onDeleteTask` props are unchanged.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, shadcn `DropdownMenu`, `lucide-react` (`Flag`, `Tag`, `Calendar`, `ChevronDown`, `Check`, `X`).

## Global Constraints

- Delete affordance is "✕" (36×36 visible circle, 44×44 tap target), not "⋮" — confirmed with user, overriding v6's incorrect claim that this was already decided.
- Trigger row scrolls horizontally (`overflow-x-auto`, no wrap), doesn't wrap to a second line — `flex-nowrap`, hidden scrollbar.
- Popover selection applies immediately on click, no confirm step; only one popover open at a time (both free from reusing `DropdownMenu`).
- Priority icon color: `text-priority-low` is `#A39B92` (the existing warm token) here — NOT the cooler `#D4D4D8` used specifically for the Today checkbox border in v3. Different context, different value, already how the tokens are set up.
- Today, Capture, Settings, WelcomeScreen — untouched by this plan.

---

### Task 1: Rewrite Inbox with trigger + popover controls

**Files:**
- Modify: `src/components/inbox-screen.tsx`

**Interfaces:**
- Consumes: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` from `@/components/ui/dropdown-menu` (existing); `Label`, `ParsedTask`, `Priority` from `@/lib/types` (existing).
- Produces: `InboxScreen` component — same props as before (`{ tasks, onChangeTask, onDeleteTask, onConfirm, onBack }`), no signature change, so `page.tsx` needs no edits.

- [ ] **Step 1: Replace the file**

`src/components/inbox-screen.tsx`:
```tsx
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
                    <DropdownMenuContent align="start">
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
                    <DropdownMenuContent align="start">
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
                    <DropdownMenuContent align="start">
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
```

- [ ] **Step 2: Verify build and lint**

```bash
npm run build
npm run lint
```

Expected: both succeed. `page.tsx` needs no changes since `InboxScreen`'s prop signature is unchanged.

- [ ] **Step 3: Manually verify all 7 scenarios from the design doc**

```bash
npm run dev
```

1. Enable Inbox (Settings), submit text with 2+ tasks — each Inbox card shows three trigger pills (icon + value + chevron) in one row.
2. Narrow the viewport (or use mobile emulation) and drag the trigger row sideways — confirms horizontal scroll, no wrap to a second line, row visibly continues past the edge.
3. Tap the Priority trigger — popover opens with 3 options, current one checked; tap a different one — trigger updates immediately, popover closes, no confirm step.
4. Open the Priority popover, then tap the Category trigger — Priority popover closes automatically.
5. Tap outside any open popover — closes without changing the value.
6. Tap "✕" on a card — removed immediately, no confirmation, other cards unaffected.
7. Confirm the delete tap target feels comfortably tappable slightly outside the visible 36px circle.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Replace Inbox pill rows with scrollable trigger+popover controls

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Push, deploy, and verify live

**Files:** none (operational task).

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

Confirm in the Vercel dashboard that the deployment reaches **Ready**.

- [ ] **Step 2: Verify on the live URL**

Open the live Vercel URL, enable Inbox in Settings, submit text, and repeat Task 1 Step 3's scenarios 1, 3, 6 (the core interactions) on the live deploy.
