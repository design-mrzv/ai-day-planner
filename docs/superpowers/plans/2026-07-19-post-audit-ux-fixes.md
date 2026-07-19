# Post-Audit UX Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship all 7 designer-flagged fixes (backdrop click-through, container padding, Inbox delete/deadline edit, Today sort + soft-complete undo toast, AI prompt time hallucination, baseline accessibility, minimal design tokens) before the 22.07.2026 12:00 deadline.

**Architecture:** Small, mostly-independent edits layered onto the existing Phase 2-4 component tree. `sortTasks` is a new pure function; soft-complete introduces one new piece of state (`undoState`) in `page.tsx` plus a new `UndoToast` component. Inbox gains a delete affordance (shadcn `DropdownMenu`) and a third pill row for deadline. Design tokens are new `@theme` aliases in `globals.css` that existing components switch to.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (adding `DropdownMenu`), `@base-ui/react` Drawer (`disablePointerDismissal` prop), `lucide-react`.

## Global Constraints

- Inbox delete ("⋮" → "Видалити задачу") applies **only** to the Inbox screen, not Today task cards — explicit user decision, designer's own default.
- Deadline editing in Inbox is limited to "Сьогодні"/"Завтра" pills — no free-form date input in MVP.
- Soft-complete: only one undo action active at a time; a second checkbox tap while a toast is showing replaces it (clears the old timeout).
- All new/changed user-facing text is Ukrainian.
- No automated test suite — manual verification per step, consistent with all prior phases.
- Design tokens alias the **existing** Tailwind default palette (`var(--color-red-500)` etc.) — no new hardcoded color values are introduced.

---

### Task 1: Backdrop click-through fix

**Files:**
- Modify: `src/components/capture-sheet.tsx`

**Interfaces:**
- Consumes: `disablePointerDismissal` prop on the `Drawer` wrapper (`src/components/ui/drawer.tsx`) — already forwarded transparently via `...props` spread onto `DrawerPrimitive.Root`, no changes needed to `drawer.tsx` itself.
- Produces: no change to `CaptureSheet`'s public props.

- [ ] **Step 1: Add an opening guard that disables pointer-dismissal for 300ms after open**

`src/components/capture-sheet.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ParsedTask } from "@/lib/types";

interface CaptureSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: string;
  onTextChange: (text: string) => void;
  onParsed: (tasks: ParsedTask[]) => void;
}

const OPENING_GUARD_MS = 300;

export function CaptureSheet({
  open,
  onOpenChange,
  text,
  onTextChange,
  onParsed,
}: CaptureSheetProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    if (!open) return;
    setIsOpening(true);
    const timeoutId = setTimeout(() => setIsOpening(false), OPENING_GUARD_MS);
    return () => clearTimeout(timeoutId);
  }, [open]);

  async function handleSubmit() {
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Не вдалося обробити, спробуй ще раз");
      }

      setStatus("idle");
      onParsed(data.tasks as ParsedTask[]);
    } catch (error) {
      setStatus("error");
      setErrorMessage(
        error instanceof Error ? error.message : "Не вдалося обробити, спробуй ще раз"
      );
    }
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} disablePointerDismissal={isOpening}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Що в голові?</DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-3 px-4 pb-6">
          <Textarea
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            placeholder="Що в голові?..."
            rows={5}
            className="text-base"
            disabled={status === "loading"}
          />
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Пиши все підряд, ми в цьому розберемось
          </p>
          {status === "error" && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={text.trim().length === 0 || status === "loading"}
          >
            {status === "loading" ? "Ми будуємо твій план..." : "Обробити"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

Note: the `text-zinc-600` change on the hint paragraph is the caption-contrast fix from Block C, bundled here since it's a one-line touch in a file this task already opens.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

Expected: succeeds.

- [ ] **Step 3: Manually verify the fix**

```bash
npm run dev
```

Rapidly tap the "+" FAB (or open devtools, throttle CPU to 4x slowdown, tap "+" then immediately tap where the backdrop is) — confirm the sheet stays open instead of closing itself. Then, once fully open, tap the backdrop (outside the sheet) — confirm it **still closes normally** (the guard must only last ~300ms).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Fix Capture sheet closing itself via backdrop click during open animation

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Container padding sweep (px-5 → px-4)

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/components/inbox-screen.tsx`
- Modify: `src/components/settings-screen.tsx`

**Interfaces:** none — purely visual class changes, no prop/type changes.

- [ ] **Step 1: Update Today's header/main/FAB horizontal spacing**

In `src/app/page.tsx`, change every `px-5` to `px-4`, and the FAB's `right-5` to `right-4`:
- `<header className="flex items-start justify-between px-5 pt-8 pb-4">` → `px-4`
- `<main className="flex-1 px-5 pb-28">` → `px-4`
- FAB button: `className="fixed bottom-6 right-5 flex h-14 w-14 ..."` → `right-4`

(The full file is rewritten in Task 4, which also touches `page.tsx` — apply this padding change there if Task 4 hasn't run yet, or confirm it's already reflected if Task 4 ran first.)

- [ ] **Step 2: Update Inbox's horizontal spacing**

In `src/components/inbox-screen.tsx`, change every `px-5` to `px-4`:
- `<header className="px-5 pt-8 pb-4">` → `px-4`
- `<main className="flex-1 space-y-3 px-5 pb-28">` → `px-4`
- Bottom action bar: `className="fixed bottom-0 left-0 right-0 flex gap-3 bg-zinc-50 px-5 py-4 dark:bg-black"` → `px-4`

- [ ] **Step 3: Update Settings' horizontal spacing**

In `src/components/settings-screen.tsx`, change every `px-5` to `px-4`:
- `<header className="flex items-center gap-3 px-5 pt-8 pb-4">` → `px-4`
- `<main className="flex-1 px-5">` → `px-4`

- [ ] **Step 4: Verify build**

```bash
npm run build
```

- [ ] **Step 5: Manually verify**

```bash
npm run dev
```

Visually confirm Today, Settings, and Inbox all have a consistent 16px gap between content and the screen edge (not flush to the edge).

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Standardize horizontal container padding to px-4 across screens

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: AI prompt — don't invent a time

**Files:**
- Modify: `src/app/api/parse/route.ts`

**Interfaces:** no signature changes — `buildPrompt` still takes `(userInput: string): string`.

- [ ] **Step 1: Add the no-guessing instruction to the prompt**

In `src/app/api/parse/route.ts`, replace the `buildPrompt` function:
```ts
function buildPrompt(userInput: string): string {
  return `Ти — асистент планування. Юзер описав свої задачі вільним текстом.
Витягни всі задачі і поверни їх як JSON масив.

Для кожної задачі визнач:
- title: назва задачі (коротко, дієслово + об'єкт)
- priority: "high" | "medium" | "low"
- deadline: "today" | "tomorrow" | "YYYY-MM-DD" | null
- time: "HH:MM" | null
- label: "work" | "personal"
- description: додаткові деталі | null

Якщо в тексті НЕ вказано конкретний час (немає цифр на кшталт "14:00", "о другій", "3 година") — онови time як null, навіть якщо є слова на кшталт "ввечері", "вранці", "потім", "згодом". Не вигадуй і не оцінюй час самостійно.

Повертай ТІЛЬКИ валідний JSON масив. Без пояснень, без markdown.

Текст юзера: ${userInput}`;
}
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Manually verify with curl**

```bash
npm run dev
```

```bash
curl -s -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{"text":"Треба ввечері подзвонити мамі"}'
```

Expected: the returned task has `"time": null` (not a guessed time like `"20:00"`).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Tell the AI not to invent a time when none is stated in the text

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Today sorting + soft-complete undo toast

**Files:**
- Create: `src/lib/sort-tasks.ts`
- Create: `src/components/undo-toast.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `Task`, `Priority` from `@/lib/types` (existing).
- Produces: `sortTasks(tasks: Task[]): Task[]` from `@/lib/sort-tasks`; `UndoToast` component from `@/components/undo-toast` with props `{ onUndo: () => void }`.

- [ ] **Step 1: Create the sort function**

`src/lib/sort-tasks.ts`:
```ts
import { Priority, Task } from "./types";

const PRIORITY_RANK: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.time && b.time) {
      const diff = timeToMinutes(a.time) - timeToMinutes(b.time);
      if (diff !== 0) return diff;
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    }
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  });
}
```

- [ ] **Step 2: Create the undo toast**

`src/components/undo-toast.tsx`:
```tsx
"use client";

interface UndoToastProps {
  onUndo: () => void;
}

export function UndoToast({ onUndo }: UndoToastProps) {
  return (
    <div
      aria-live="polite"
      className="fixed inset-x-4 bottom-24 z-40 rounded-2xl bg-zinc-900 px-4 py-3 text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-900"
    >
      <button type="button" onClick={onUndo} className="block text-base font-bold">
        Скасувати
      </button>
      <p className="text-sm text-zinc-300 dark:text-zinc-600">Виконано</p>
    </div>
  );
}
```

- [ ] **Step 3: Wire sorting, soft-complete, and the toast into `page.tsx`**

`src/app/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { Settings as SettingsIcon } from "lucide-react";
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

function todayLabel(): string {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function toTask(parsed: ParsedTask, uniqueSuffix: string): Task {
  return { ...parsed, id: `${Date.now()}-${uniqueSuffix}`, done: false };
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

    setUndoState((prev) => {
      if (prev) clearTimeout(prev.timeoutId);
      const timeoutId = setTimeout(() => setUndoState(null), 4000);
      return { task: target, timeoutId };
    });
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

  const visibleTasks = sortTasks(tasks.filter((task) => !task.done));

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-start justify-between px-4 pt-8 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Today
          </h1>
          <p className="mt-1 text-sm capitalize text-zinc-600 dark:text-zinc-400">
            {todayLabel()}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setScreen("settings")}
          aria-label="Settings"
          className="mt-1 text-zinc-600 dark:text-zinc-400"
        >
          <SettingsIcon size={24} />
        </button>
      </header>

      <main className="flex-1 px-4 pb-28">
        {visibleTasks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-24 text-center">
            <span className="text-4xl">📝</span>
            <p className="max-w-xs text-zinc-600 dark:text-zinc-400">
              Що плануєш сьогодні? Натисни + і розкажи все що в голові
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {visibleTasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggleDone={handleComplete} />
            ))}
          </div>
        )}
      </main>

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className={`fixed bottom-6 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-2xl text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-900 ${
          visibleTasks.length === 0 ? "animate-pulse" : ""
        }`}
        aria-label="Додати задачі"
      >
        +
      </button>

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

Note: `InboxScreen` now receives a new `onDeleteTask` prop that doesn't exist yet — Task 5 adds it to `InboxScreen`'s props interface. `npm run build` in this task will fail on that prop until Task 5 lands; that's expected and called out in Step 4 below.

- [ ] **Step 4: Verify build (expected to fail on the missing `onDeleteTask` prop)**

```bash
npm run build
```

Expected: TypeScript error on `InboxScreen`, specifically that `onDeleteTask` is not an accepted prop — this is expected until Task 5. Do not attempt to fix `InboxScreen` in this task; that's Task 5's job. If you'd rather see a clean build, you may temporarily comment out the `onDeleteTask={handleDeleteInboxTask}` line, but restore it before moving to Task 5.

- [ ] **Step 5: Manually verify sorting and undo (temporarily bypassing the InboxScreen type error via the workaround above, or just proceed to Task 5 first if easier)**

```bash
npm run dev
```

1. Add several tasks with different times/priorities via Capture (Inbox disabled) — confirm Today shows them ordered: earliest time first, no-time tasks at the bottom sorted by priority.
2. Tap a checkbox — confirm the task disappears immediately (no animation) and the undo toast appears above the FAB.
3. Tap "Скасувати" — confirm the task reappears in its correct sorted position.
4. Complete a task and wait 4+ seconds without tapping "Скасувати" — confirm the toast disappears on its own and the task stays gone from Today (but is still in `localStorage` as `done: true` — check via devtools).
5. Complete two tasks in quick succession (second tap before the first toast's 4s expires) — confirm only one toast is visible at a time, and "Скасувати" on the second toast undoes the second task.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Sort Today by time/priority, add soft-complete with undo toast

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Inbox delete ("⋮" menu)

**Files:**
- Create: `src/components/ui/dropdown-menu.tsx` (via shadcn)
- Modify: `src/components/inbox-screen.tsx`

**Interfaces:**
- Consumes: `DropdownMenu`, `DropdownMenuTrigger`, `DropdownMenuContent`, `DropdownMenuItem` from `@/components/ui/dropdown-menu` (shadcn-generated).
- Produces: `InboxScreen` gains a new required prop `onDeleteTask: (index: number) => void` — this is the prop `page.tsx` already passes as of Task 4.

- [ ] **Step 1: Add the DropdownMenu component via shadcn**

```bash
npx shadcn@latest add dropdown-menu -y
```

Expected: creates `src/components/ui/dropdown-menu.tsx`.

- [ ] **Step 2: Add the delete menu to each Inbox card**

`src/components/inbox-screen.tsx`:
```tsx
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

export function InboxScreen({
  tasks,
  onChangeTask,
  onDeleteTask,
  onConfirm,
  onBack,
}: InboxScreenProps) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Ось що ми знайшли
        </h1>
      </header>

      <main className="flex-1 space-y-3 px-4 pb-28">
        {tasks.map((task, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={task.title}
                onChange={(event) =>
                  onChangeTask(index, { title: event.target.value })
                }
                className="w-full flex-1 rounded-md border border-zinc-200 px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-900"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Опції задачі"
                    className="shrink-0 rounded-full p-2 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                  >
                    <MoreVertical size={18} />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => onDeleteTask(index)}
                    className="text-red-600 focus:bg-red-50 focus:text-red-600"
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

            <div className="flex flex-wrap gap-1.5">
              {DEADLINE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChangeTask(index, { deadline: option.value })}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    task.deadline === option.value
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

      <div className="fixed bottom-0 left-0 right-0 flex gap-3 bg-zinc-50 px-4 py-4 dark:bg-black">
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
```

This step also folds in: the `px-4` padding sweep for this file (Task 2's scope, applied here since this task rewrites the whole file anyway), the `rounded-xl` → `rounded-2xl` card radius (Task 8's scope), and the deadline pill row (Task 6's scope) — all bundled because they land on the exact same JSX this task is already rewriting. Tasks 2, 6, and 8 should skip re-touching this file if this task already ran.

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: succeeds now (the `onDeleteTask` prop `page.tsx` passes from Task 4 now matches).

- [ ] **Step 4: Manually verify delete**

```bash
npm run dev
```

Enable Inbox in Settings, submit text that parses into 2+ tasks, open the "⋮" menu on one card, tap "Видалити задачу" — confirm that card disappears from the list and the rest remain, editable and confirmable as before.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Add Inbox task delete via dropdown menu, deadline pills, padding/radius cleanup

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Inbox deadline pills — already delivered in Task 5

Task 5's rewrite of `src/components/inbox-screen.tsx` already includes the "Сьогодні"/"Завтра" pill row (`DEADLINE_OPTIONS`) described in the design doc's Block B. No separate action needed here — this task exists only so the plan's task list matches the design doc's item numbering. Skip directly to Task 7.

**Manual verification (do this now if not already covered by Task 5's Step 4):**
In Inbox, tap "Сьогодні" or "Завтра" on a card's third pill row, then "Додати все в Today" — confirm the resulting Today task's deadline reflects the choice (e.g., a task set to "Завтра" shows "Завтра" on its Today card).

---

### Task 7: Design tokens + TaskCard accessibility

**Files:**
- Modify: `src/app/globals.css`
- Modify: `src/components/task-card.tsx`

**Interfaces:**
- Produces: new Tailwind utility classes available globally: `bg-priority-high`, `bg-priority-medium`, `bg-priority-low`, `bg-label-work-bg`, `text-label-work`, `bg-label-personal-bg`, `text-label-personal`.
- `TaskCard`'s props (`{ task: Task; onToggleDone: (id: string) => void }`) are unchanged — only internals change.

- [ ] **Step 1: Add the priority/label color tokens**

In `src/app/globals.css`, add a new `@theme` block right after the existing `@theme inline { ... }` block (before `:root { ... }`):
```css
@theme {
  --color-priority-high: var(--color-red-500);
  --color-priority-medium: var(--color-amber-500);
  --color-priority-low: var(--color-zinc-400);
  --color-label-work: var(--color-blue-700);
  --color-label-work-bg: var(--color-blue-100);
  --color-label-personal: var(--color-green-700);
  --color-label-personal-bg: var(--color-green-100);
}
```

- [ ] **Step 2: Rewrite TaskCard using the new tokens, plus accessibility fixes**

`src/components/task-card.tsx`:
```tsx
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
```

What changed and why:
- Priority indicator: was a plain color dot with `aria-hidden` (color-only signal, invisible to screen readers and colorblind users). Now a small filled circle with a 1-letter badge (В/С/Н) **and** an `aria-label` with the full word — color is no longer the only carrier of meaning.
- Checkbox: wrapped in a `-m-3 p-3` span. The negative margin cancels the padding's effect on layout (visually identical position/size), but the padding expands the actual clickable/tappable region to ~44×44px.
- Card radius: `rounded-xl` → `rounded-2xl` (design token consistency — cards use one radius, pills use `rounded-full`).
- Colors: `bg-red-500`/`bg-amber-500`/`bg-zinc-400` → `bg-priority-*`; `bg-blue-100 text-blue-700`/`bg-green-100 text-green-700` → `bg-label-*-bg text-label-*` (same visual result, now backed by the shared token names from Step 1).
- Caption contrast: `text-zinc-500` → `text-zinc-600` on the time and deadline text (contrast fix).

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Manually verify visually and with devtools accessibility tree**

```bash
npm run dev
```

1. Confirm task cards render identically in color to before (red/amber/grey dots, blue/green tags) — the token indirection shouldn't change appearance.
2. Confirm the priority dot now shows a tiny letter (В/С/Н) inside it.
3. In Chrome DevTools, inspect the priority dot element — confirm its Accessibility pane shows the full `aria-label` text (e.g. "Високий пріоритет").
4. On a real phone or with devtools device toolbar, confirm the checkbox is comfortably tappable slightly outside its visible square (not just the exact 20×20px box).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Add priority/label design tokens, fix TaskCard color-only signaling and tap target

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Remaining accessibility — Settings card radius, focus/contrast verification

**Files:**
- Modify: `src/components/settings-screen.tsx`

**Interfaces:** none — visual class change only.

- [ ] **Step 1: Match the card radius token in Settings**

In `src/components/settings-screen.tsx`, change the toggle row's `rounded-xl` to `rounded-2xl`:
```tsx
<label className="flex items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Manually verify the remaining accessibility items (no code changes expected — these confirm behavior already provided by `@base-ui/react` and prior tasks)**

```bash
npm run dev
```

1. **Semantic form controls:** in devtools, confirm the Today checkbox is a real `<input type="checkbox">` (it is — unchanged from Phase 2) and the Settings toggle is a real `role="switch"` element (shadcn's `Switch`, built on Base UI — already correct from Phase 4).
2. **Drawer focus trap:** open Capture, confirm focus visibly lands in the `Textarea` (try typing immediately without clicking). Press `Tab` repeatedly — confirm focus cycles only among elements inside the sheet (Textarea → "Обробити" button → back to Textarea), never escaping to Today content behind it. Press `Esc` — confirm the sheet closes.
3. **Toast `aria-live`:** in devtools, inspect the `UndoToast` div while it's showing — confirm `aria-live="polite"` is present (added in Task 4).
4. **Contrast:** open Chrome DevTools → Elements → select a caption text node (e.g. the Today date, or a task's time) → check the color contrast ratio shown in the color picker/inspector. Confirm it reports ≥ 4.5:1 against the `zinc-50` background in light mode.

If any of these fail, stop and report the specific failure — do not guess a fix without seeing what actually broke.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Match Settings card radius to the card design token

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Push, deploy, and full regression verification

**Files:** none (operational task).

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

Confirm in the Vercel dashboard that the deployment reaches **Ready**.

- [ ] **Step 2: Full manual regression pass on the live URL**

Open the live Vercel URL on a real phone and walk through, in order:
1. Rapid-tap "+" — sheet doesn't self-close (Task 1).
2. Submit "Треба ввечері подзвонити мамі" — resulting task has no time shown (Task 3).
3. Visual check: consistent padding on Today, Settings, Inbox (Task 2).
4. Add a few tasks with mixed times/priorities, confirm sort order; complete one, confirm undo toast and undo behavior, let one time out (Task 4).
5. Enable Inbox in Settings, submit text, delete one parsed task via "⋮", set a deadline pill, confirm all in Today after "Додати все в Today" (Tasks 5-6).
6. Confirm priority dots show letters + colors, checkboxes feel easier to tap, Settings/cards have consistent rounded corners (Tasks 7-8).

Report back with the outcome — if anything regressed from the Phase 2-4 baseline (Capture flow, localStorage persistence, onboarding), stop and flag it rather than treating this phase as done.
