# Phase 4: Settings + Inbox Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Settings screen with a single toggle ("Переглядати задачі перед додаванням", default off) and an Inbox review screen that appears between Capture and Today when the toggle is on, per `PRODUCT_SPEC.md` §3 (Екран 3, Екран 4) and §4 (Флоу C).

**Architecture:** `page.tsx` gains a `screen: "today" | "settings" | "inbox"` state machine (rendered after the existing onboarding gate, same conditional-render pattern as `WelcomeScreen`). `CaptureSheet` becomes a controlled component for its text (`text`/`onTextChange` props instead of internal `useState`) so the Inbox's "Назад" button can hand the user back to Capture with their original text intact — text now lives in `page.tsx`, so it survives `CaptureSheet` unmounting when the screen switches away from Today. `storage.ts` gains `loadInboxEnabled`/`saveInboxEnabled` for the new `"inbox_enabled"` key.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui (adding `Switch`), `lucide-react` (already a dependency via shadcn init, used here for the Settings icon).

## Global Constraints

- `"inbox_enabled"` localStorage key, default `false` when absent — matches `PRODUCT_SPEC.md` §3 ("За замовчуванням: вимкнено").
- When Inbox is disabled, behavior is byte-for-byte the same as Phase 2/3 (Capture → Today directly) — this must not regress.
- Inbox editing covers only `title`, `priority`, `label` per user's explicit scope decision — `deadline`/`time`/`description` are not editable in this phase.
- The "Назад" button in Inbox returns to Capture with the original typed text preserved, not a blank Capture sheet — this is the reason `CaptureSheet`'s text state is lifted to `page.tsx`.
- No automated tests — manual verification per step, consistent with Phases 2-3.

---

### Task 1: `storage.ts` additions + `Switch` component + `SettingsScreen`

**Files:**
- Modify: `src/lib/storage.ts`
- Create: `src/components/settings-screen.tsx`

**Interfaces:**
- Consumes: nothing new (storage.ts already has the `try/catch` pattern established in Phase 3).
- Produces: `loadInboxEnabled(): boolean`, `saveInboxEnabled(value: boolean): void` from `@/lib/storage`; `Switch` component from `@/components/ui/switch` (shadcn); `SettingsScreen` component from `@/components/settings-screen` with props `{ inboxEnabled: boolean; onToggleInbox: (value: boolean) => void; onBack: () => void }`. Task 3 wires `SettingsScreen` into `page.tsx`.

- [ ] **Step 1: Add the Switch component via shadcn**

```bash
npx shadcn@latest add switch -y
```

Expected: creates `src/components/ui/switch.tsx`.

- [ ] **Step 2: Add inbox-enabled storage functions**

Append to `src/lib/storage.ts` (after the existing `saveOnboardingDone` function):
```ts
const INBOX_KEY = "inbox_enabled";

export function loadInboxEnabled(): boolean {
  try {
    return localStorage.getItem(INBOX_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveInboxEnabled(value: boolean): void {
  try {
    localStorage.setItem(INBOX_KEY, value ? "true" : "false");
  } catch (error) {
    console.error("Failed to save inbox setting to localStorage", error);
  }
}
```

- [ ] **Step 3: Create the Settings screen**

`src/components/settings-screen.tsx`:
```tsx
"use client";

import { Switch } from "@/components/ui/switch";

interface SettingsScreenProps {
  inboxEnabled: boolean;
  onToggleInbox: (value: boolean) => void;
  onBack: () => void;
}

export function SettingsScreen({
  inboxEnabled,
  onToggleInbox,
  onBack,
}: SettingsScreenProps) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center gap-3 px-5 pt-8 pb-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Назад"
          className="text-2xl text-zinc-900 dark:text-zinc-50"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>
      </header>

      <main className="flex-1 px-5">
        <label className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <span className="text-base text-zinc-900 dark:text-zinc-50">
            Переглядати задачі перед додаванням
          </span>
          <Switch checked={inboxEnabled} onCheckedChange={onToggleInbox} />
        </label>
      </main>
    </div>
  );
}
```

- [ ] **Step 4: Verify build and lint**

```bash
npm run build
npm run lint
```

Expected: both succeed (`SettingsScreen` isn't imported anywhere yet, so this only checks it compiles standalone).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Add inbox-enabled storage helpers, Switch component, Settings screen

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: `InboxScreen`

**Files:**
- Create: `src/components/inbox-screen.tsx`

**Interfaces:**
- Consumes: `ParsedTask`, `Priority`, `Label` from `@/lib/types` (existing, Phase 2).
- Produces: `InboxScreen` component from `@/components/inbox-screen` with props `{ tasks: ParsedTask[]; onChangeTask: (index: number, patch: Partial<ParsedTask>) => void; onConfirm: () => void; onBack: () => void }`. Task 3 wires it into `page.tsx`.

- [ ] **Step 1: Create the Inbox screen**

`src/components/inbox-screen.tsx`:
```tsx
"use client";

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

interface InboxScreenProps {
  tasks: ParsedTask[];
  onChangeTask: (index: number, patch: Partial<ParsedTask>) => void;
  onConfirm: () => void;
  onBack: () => void;
}

export function InboxScreen({
  tasks,
  onChangeTask,
  onConfirm,
  onBack,
}: InboxScreenProps) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Ось що ми знайшли
        </h1>
      </header>

      <main className="flex-1 space-y-3 px-5 pb-28">
        {tasks.map((task, index) => (
          <div
            key={index}
            className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
          >
            <input
              type="text"
              value={task.title}
              onChange={(event) =>
                onChangeTask(index, { title: event.target.value })
              }
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-base dark:border-zinc-700 dark:bg-zinc-900"
            />

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
          </div>
        ))}
      </main>

      <div className="fixed bottom-0 left-0 right-0 flex gap-3 bg-zinc-50 px-5 py-4 dark:bg-black">
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

- [ ] **Step 2: Verify build and lint**

```bash
npm run build
npm run lint
```

Expected: both succeed.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Add Inbox review screen with inline title/priority/label editing

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Controlled `CaptureSheet`, screen state machine, wire everything into `page.tsx`

**Files:**
- Modify: `src/components/capture-sheet.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `SettingsScreen` (Task 1), `InboxScreen` (Task 2), `loadInboxEnabled`/`saveInboxEnabled` (Task 1), existing `WelcomeScreen`, `TaskCard`, `loadTasks`/`saveTasks`/`loadOnboardingDone`/`saveOnboardingDone` (Phase 3), `ParsedTask`/`Task` (Phase 2).
- Produces: no new exports — `CaptureSheet`'s prop shape changes (`text`/`onTextChange` replace its internal state), which is a breaking change only relevant within this task since `page.tsx` is updated in the same task.

- [ ] **Step 1: Make `CaptureSheet` a controlled component for text**

`src/components/capture-sheet.tsx`:
```tsx
"use client";

import { useState } from "react";
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

export function CaptureSheet({
  open,
  onOpenChange,
  text,
  onTextChange,
  onParsed,
}: CaptureSheetProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

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
    <Drawer open={open} onOpenChange={onOpenChange}>
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
          <p className="text-sm text-zinc-500">
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

Note: `onParsed` is now called *before* clearing anything — the caller (`page.tsx`) owns `text` and decides whether/when to clear it, since the Inbox flow must NOT clear it on a successful parse (only on final confirm).

- [ ] **Step 2: Wire the screen state machine into `page.tsx`**

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
import {
  loadInboxEnabled,
  loadOnboardingDone,
  loadTasks,
  saveInboxEnabled,
  saveOnboardingDone,
  saveTasks,
} from "@/lib/storage";
import { ParsedTask, Task } from "@/lib/types";

type Screen = "today" | "settings" | "inbox";

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

  function handleToggleDone(id: string) {
    setTasks((prev) =>
      (prev ?? []).map((task) =>
        task.id === id ? { ...task, done: !task.done } : task
      )
    );
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
        onConfirm={handleConfirmInbox}
        onBack={handleBackFromInbox}
      />
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-start justify-between px-5 pt-8 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
            Today
          </h1>
          <p className="mt-1 text-sm capitalize text-zinc-500">{todayLabel()}</p>
        </div>
        <button
          type="button"
          onClick={() => setScreen("settings")}
          aria-label="Settings"
          className="mt-1 text-zinc-500"
        >
          <SettingsIcon size={24} />
        </button>
      </header>

      <main className="flex-1 px-5 pb-28">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-3 pt-24 text-center">
            <span className="text-4xl">📝</span>
            <p className="max-w-xs text-zinc-500">
              Що плануєш сьогодні? Натисни + і розкажи все що в голові
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onToggleDone={handleToggleDone} />
            ))}
          </div>
        )}
      </main>

      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        className={`fixed bottom-6 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-2xl text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-900 ${
          tasks.length === 0 ? "animate-pulse" : ""
        }`}
        aria-label="Додати задачі"
      >
        +
      </button>

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

- [ ] **Step 3: Verify build and lint**

```bash
npm run build
npm run lint
```

Expected: both succeed.

- [ ] **Step 4: Manually verify all 5 scenarios from the design doc**

```bash
npm run dev
```

In the browser (mobile viewport):

1. Confirm Settings is off by default (fresh `localStorage`, or check `localStorage.getItem("inbox_enabled")` is `null`/`"false"`). Tap "+", submit the spec's example text — confirm tasks land directly in Today, no Inbox screen appears (same as Phase 2/3 behavior).
2. Tap the Settings icon (top-right of Today) → toggle "Переглядати задачі перед додаванням" on → tap back arrow → confirm `localStorage.getItem("inbox_enabled") === "true"`. Tap "+", submit the same example text → confirm the **Inbox** screen appears (not Today) titled "Ось що ми знайшли", showing the 3 parsed tasks.
3. In Inbox, edit one task's title (text input) and change another task's priority (tap a different segmented button) → tap "Додати все в Today" → confirm Today now shows the tasks with the edited title and priority.
4. Tap "+" again, type new text, submit → in Inbox, tap "Назад" → confirm the Capture sheet reopens with the exact text just typed (not empty) → edit the text slightly and submit again → confirm it re-parses and Inbox shows the updated results.
5. Reload the page → confirm the Settings toggle is still on (`localStorage` persisted) and Today's existing tasks are still there.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Wire Settings + Inbox flow, make Capture text controlled by page.tsx

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

Expected: pushes cleanly (git author email for this repo is already `design.mrzv@gmail.com` from the Phase 2 fix). Confirm in the Vercel dashboard that the new deployment reaches **Ready**.

- [ ] **Step 2: Verify the full Settings + Inbox flow on the live URL**

Open the live Vercel URL and repeat Task 3 Step 4's scenarios 1-4 (scenario 5's reload check is optional here since it was already proven locally). Confirm no regressions in the non-Inbox path (scenario 1) — this is the default experience for all existing users and must keep working exactly as before.
