# Phase 3: localStorage + Welcome/Onboarding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tasks and onboarding state persist across page reloads via localStorage, and first-time users see a Welcome screen before an empty Today (matching `PRODUCT_SPEC.md` Flow A), instead of the Phase 2 hardcoded seed tasks.

**Architecture:** A pure `src/lib/storage.ts` module wraps `localStorage` reads/writes for tasks and the onboarding flag, swallowing errors so a corrupted value or unavailable storage never crashes the app. `src/app/page.tsx` hydrates both values in a single `useEffect` on mount (state starts as `null` to signal "not yet read"), renders nothing until hydrated, then conditionally renders `WelcomeScreen` or the existing Today UI. A second `useEffect` persists `tasks` to storage on every change, guarded so it never fires before hydration completes.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, `localStorage` Web API (client-only, browser `window.localStorage`).

## Global Constraints

- No "daily" logic — all stored tasks always show in Today regardless of `deadline`, per user's explicit choice (rollover/archiving is out of scope for MVP).
- Seed tasks (`src/lib/seed-tasks.ts`) are deleted entirely — new users see a real empty Today after Welcome, per Flow A in `PRODUCT_SPEC.md` §4.
- Welcome renders via conditional render inside `src/app/page.tsx` (no separate route), per user's explicit choice.
- `localStorage` keys: `"tasks"` (JSON array) and `"onboarding_done"` (`"true"` string), matching the key name used in `PRODUCT_SPEC.md` §3.
- All `localStorage` reads/writes are wrapped in `try/catch` — corrupted data or unavailable storage (private browsing, quota exceeded) degrades gracefully (empty tasks, no persistence) rather than crashing.
- Settings and Inbox (spec §8 step 7) are explicitly out of scope for this phase.
- After deploying, a manual check on a real phone is required to confirm the blank hydration frame is imperceptible (see Task 3, Step 2) — this was an explicit request from the user, not optional.

---

### Task 1: `storage.ts` and `WelcomeScreen`

**Files:**
- Create: `src/lib/storage.ts`
- Create: `src/components/welcome-screen.tsx`

**Interfaces:**
- Consumes: `Task` from `@/lib/types` (existing, Phase 2).
- Produces: `loadTasks(): Task[]`, `saveTasks(tasks: Task[]): void`, `loadOnboardingDone(): boolean`, `saveOnboardingDone(): void` from `@/lib/storage`; `WelcomeScreen` component from `@/components/welcome-screen` with props `{ onStart: () => void }`. Task 2 wires both into `page.tsx`.

- [ ] **Step 1: Create the storage module**

`src/lib/storage.ts`:
```ts
import { Task } from "./types";

const TASKS_KEY = "tasks";
const ONBOARDING_KEY = "onboarding_done";

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Task[]) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Failed to save tasks to localStorage", error);
  }
}

export function loadOnboardingDone(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveOnboardingDone(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, "true");
  } catch (error) {
    console.error("Failed to save onboarding flag to localStorage", error);
  }
}
```

- [ ] **Step 2: Create the Welcome screen**

`src/components/welcome-screen.tsx`:
```tsx
"use client";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-8 text-center dark:bg-black">
      <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
        AI Day Planner
      </h1>
      <p className="max-w-xs text-lg text-zinc-600 dark:text-zinc-400">
        Розкажи все, що в голові. Ми складемо план на день
      </p>
      <button
        type="button"
        onClick={onStart}
        className="rounded-full bg-zinc-900 px-8 py-3 text-base font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
      >
        Почати
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Verify build and lint**

```bash
npm run build
npm run lint
```

Expected: both succeed with no errors (neither file is imported anywhere yet, so this only checks they compile standalone).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Add localStorage helpers and Welcome screen component

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Wire hydration and persistence into Today, remove seed data

**Files:**
- Modify: `src/app/page.tsx`
- Delete: `src/lib/seed-tasks.ts`

**Interfaces:**
- Consumes: `loadTasks`, `saveTasks`, `loadOnboardingDone`, `saveOnboardingDone` from `@/lib/storage` (Task 1); `WelcomeScreen` from `@/components/welcome-screen` (Task 1); existing `TaskCard`, `CaptureSheet`, `ParsedTask`, `Task` (Phase 2, unchanged).
- Produces: no new exports — this is the top-level page component.

- [ ] **Step 1: Delete the seed data file**

```bash
rm src/lib/seed-tasks.ts
```

- [ ] **Step 2: Rewrite the Today page with hydration and persistence**

> **Note:** this repo's `eslint-config-next` enables the React Compiler lint preset, which errors on `react-hooks/set-state-in-effect` for any `setState` call inside a `useEffect` body — including this legitimate "hydrate from an external system on mount" case. As executed, the hydration effect below is wrapped in `/* eslint-disable react-hooks/set-state-in-effect */` / `/* eslint-enable ... */` with a comment explaining why (localStorage isn't available during SSR, so a `useState` initializer can't read it).

`src/app/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { TaskCard } from "@/components/task-card";
import { CaptureSheet } from "@/components/capture-sheet";
import { WelcomeScreen } from "@/components/welcome-screen";
import {
  loadOnboardingDone,
  loadTasks,
  saveOnboardingDone,
  saveTasks,
} from "@/lib/storage";
import { ParsedTask, Task } from "@/lib/types";

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
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setTasks(loadTasks());
    setOnboardingDone(loadOnboardingDone());
  }, []);

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
    setTasks((prev) => [
      ...(prev ?? []),
      ...parsedTasks.map((parsed, index) => toTask(parsed, String(index))),
    ]);
    setSheetOpen(false);
  }

  if (tasks === null || onboardingDone === null) {
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

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="px-5 pt-8 pb-4">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          Today
        </h1>
        <p className="mt-1 text-sm capitalize text-zinc-500">{todayLabel()}</p>
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

      <CaptureSheet open={sheetOpen} onOpenChange={setSheetOpen} onParsed={handleParsed} />
    </div>
  );
}
```

- [ ] **Step 3: Verify build and lint**

```bash
npm run build
npm run lint
```

Expected: both succeed. `npm run build` confirms `seed-tasks.ts` removal didn't leave a dangling import.

- [ ] **Step 4: Manually verify persistence and onboarding, steps 1-5**

```bash
npm run dev
```

In the browser (mobile viewport), open devtools and clear `localStorage` for the site, then:

1. Reload — confirm **Welcome** screen shows (not Today), with the product name, slogan, and "Почати" button.
2. Tap "Почати" — confirm it navigates to Today with the empty state (no seed tasks), and `localStorage.getItem("onboarding_done")` is `"true"` in devtools.
3. Tap "+", add a task via Capture (e.g. the spec's example text) — confirm it appears in Today, then reload the page — confirm the task is still there.
4. Check the checkbox on a task, reload — confirm the `done` state persisted.
5. In devtools, run `localStorage.removeItem("tasks")` (leave `onboarding_done` alone), reload — confirm it goes straight to Today with an empty list, **not** back to Welcome (this is Flow B — returning user, no re-onboarding).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Persist tasks and onboarding state to localStorage, add Welcome flow

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Push, deploy, and verify on a real phone

**Files:** none (operational task).

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

Expected: pushes cleanly (no force needed — the git author email was already fixed in Phase 2 and `git config user.email` for this repo is still `design.mrzv@gmail.com`). Vercel auto-deploys on push; confirm in the Vercel dashboard that the new deployment for this commit reaches **Ready**.

- [ ] **Step 2: Verify the full flow and the hydration frame on a real phone**

Open the live Vercel URL on an actual phone (not just a resized desktop browser) with a fresh site data / private browsing tab so onboarding hasn't run yet:

1. Load the URL — watch closely for any flash of white screen or visible delay before Welcome appears. This is the check the user explicitly asked for.
2. If there is a perceptible blank flash or delay: stop, report it, and revisit the design doc's hydration approach (e.g. add a lightweight loading state) before considering this phase done.
3. If it's imperceptible: continue — tap "Почати", confirm empty Today, add a task via Capture, reload the page on the phone, confirm the task persisted.
