# Visual Redesign v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the designer's v2 visual redesign (warm terracotta palette, Unbounded/Manrope typography, graduated radius, tinted shadows, hover/press/spring interaction states, staggered list entry, noise overlay) across every screen, replacing the current zinc/Geist look.

**Architecture:** A single new token layer in `globals.css` (colors, radius, shadows-as-arbitrary-values, keyframe animations) plus new fonts wired into `layout.tsx`. Every existing screen/component is restyled to consume these tokens — no new components, no new state beyond a per-`TaskCard` animation-delay prop and a per-checkbox "just checked" flag for the spring animation. Dark mode is removed (single warm theme, confirmed with user).

**Tech Stack:** Next.js 16 (App Router), Tailwind CSS v4 (`@theme` tokens), `next/font/google` (Unbounded, Manrope), plain CSS `@keyframes` (no motion library).

## Global Constraints

- Colors, exact hex values from `DESIGN_SPEC_v2.md` §1 — copied verbatim in Task 1.
- Capture sheet copy: placeholder → "Пиши все підряд, ми в цьому розберемось...", hint → "AI визначить пріоритет, час і категорію сам" (mockup wins over the spec doc's narrower claim — confirmed with user).
- H1 "Today" → "Сьогодні", Settings screen title "Settings" → "Налаштування" — the only two copy changes outside Capture; "Додати все в Today" in `InboxScreen` keeps its literal spec wording (out of the confirmed copy-change scope).
- Empty state stays the 📝 emoji — `empty_state_illustration.svg` is unused, per earlier explicit decision.
- Task completion stays instant removal, no fade-out — confirmed with user, overrides v1 §4's fade-out request.
- Dark mode (`dark:` variants, `.dark` CSS block) is removed entirely — single warm light theme, confirmed with user.
- No new npm dependencies for motion — plain CSS `@keyframes`/`transition`.
- Fonts must include the `cyrillic` subset (not just `latin`) — the whole point of choosing Unbounded/Manrope over Geist is Cyrillic support, and `next/font/google` only downloads the subsets you list.

---

### Task 1: Fonts, color/radius tokens, noise overlay, keyframe animations

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Produces: Tailwind utility classes available to every later task — `bg-bg-base`, `bg-surface`, `text-text-primary`, `text-text-secondary`, `text-text-tertiary`, `bg-accent`, `bg-accent-hover`, `bg-accent-tint`, `border-accent-border`, `accent-accent` (native checkbox tint), `rounded-card`, `rounded-input`, `rounded-checkbox`, plus CSS animation classes `animate-card-in`, `animate-toast-in`, `animate-pulse-ring`, `animate-checkbox-pop`. Also: shadcn's own `--primary`/`--primary-foreground` now resolve to accent/white, so `Button` (default variant) and `Switch` (checked state) automatically render in the new accent color with no per-component override needed.

- [ ] **Step 1: Replace the fonts in the root layout**

`src/app/layout.tsx`:
```tsx
import type { Metadata, Viewport } from "next";
import { Manrope, Unbounded } from "next/font/google";
import "./globals.css";

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "AI Day Planner",
  description: "AI-планер дня",
};

// iOS Safari can leave `position: fixed` elements (like the Capture drawer's
// overlay) visually detached from the viewport after the on-screen keyboard
// opens/closes, because by default the keyboard only shrinks the *visual*
// viewport while the layout viewport (which fixed elements are positioned
// against) stays unchanged. `resizes-content` makes the keyboard resize the
// layout viewport too, so fixed positioning stays correct.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="uk"
      className={`${unbounded.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-bg-base text-text-primary">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Replace `globals.css` with the v2 token set**

`src/app/globals.css`:
```css
@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-manrope);
  --font-mono: var(--font-manrope);
  --font-heading: var(--font-unbounded);
  --color-sidebar-ring: var(--sidebar-ring);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
  --color-sidebar-primary: var(--sidebar-primary);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar: var(--sidebar);
  --color-chart-5: var(--chart-5);
  --color-chart-4: var(--chart-4);
  --color-chart-3: var(--chart-3);
  --color-chart-2: var(--chart-2);
  --color-chart-1: var(--chart-1);
  --color-ring: var(--ring);
  --color-input: var(--input);
  --color-border: var(--border);
  --color-destructive: var(--destructive);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent: var(--accent);
  --color-muted-foreground: var(--muted-foreground);
  --color-muted: var(--muted);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-secondary: var(--secondary);
  --color-primary-foreground: var(--primary-foreground);
  --color-primary: var(--primary);
  --color-popover-foreground: var(--popover-foreground);
  --color-popover: var(--popover);
  --color-card-foreground: var(--card-foreground);
  --color-card: var(--card);
  --radius-sm: calc(var(--radius) * 0.6);
  --radius-md: calc(var(--radius) * 0.8);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) * 1.4);
  --radius-2xl: calc(var(--radius) * 1.8);
  --radius-3xl: calc(var(--radius) * 2.2);
  --radius-4xl: calc(var(--radius) * 2.6);
}

@theme {
  --color-bg-base: #FAF7F2;
  --color-surface: #FFFFFF;
  --color-text-primary: #1C1815;
  --color-text-secondary: #7A7069;
  --color-text-tertiary: #B0A79E;
  --color-accent: #B5502F;
  --color-accent-hover: #96401F;
  --color-accent-tint: #FBEDE7;
  --color-accent-border: #F0D3C4;
  --color-priority-high: #EF4444;
  --color-priority-medium: #F59E0B;
  --color-priority-low: #A39B92;
  --color-label-work: #3B82F6;
  --color-label-work-bg: #E4EEFC;
  --color-label-personal: #22C55E;
  --color-label-personal-bg: #E4F6E9;
  --radius-card: 24px;
  --radius-input: 16px;
  --radius-checkbox: 8px;
}

:root {
  --background: #FAF7F2;
  --foreground: #1C1815;
  --card: #FFFFFF;
  --card-foreground: #1C1815;
  --popover: #FFFFFF;
  --popover-foreground: #1C1815;
  --primary: #B5502F;
  --primary-foreground: #FFFFFF;
  --secondary: #FBEDE7;
  --secondary-foreground: #B5502F;
  --muted: #F0D3C4;
  --muted-foreground: #7A7069;
  --accent: #FBEDE7;
  --accent-foreground: #B5502F;
  --destructive: #EF4444;
  --border: #F0D3C4;
  --input: #F0D3C4;
  --ring: #B5502F;
  --chart-1: #B5502F;
  --chart-2: #96401F;
  --chart-3: #7A7069;
  --chart-4: #B0A79E;
  --chart-5: #F0D3C4;
  --radius: 0.625rem;
  --sidebar: #FFFFFF;
  --sidebar-foreground: #1C1815;
  --sidebar-primary: #B5502F;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #FBEDE7;
  --sidebar-accent-foreground: #B5502F;
  --sidebar-border: #F0D3C4;
  --sidebar-ring: #B5502F;
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}

body::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  opacity: 0.03;
  mix-blend-mode: multiply;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
}

@keyframes card-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 0.55;
  }
  100% {
    transform: scale(1.55);
    opacity: 0;
  }
}

@keyframes checkbox-pop {
  0% {
    transform: scale(0);
  }
  60% {
    transform: scale(1.15);
  }
  100% {
    transform: scale(1);
  }
}

.animate-card-in {
  animation: card-in 320ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.animate-toast-in {
  animation: toast-in 280ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

.animate-pulse-ring {
  animation: pulse-ring 1.8s infinite;
}

.animate-checkbox-pop {
  animation: checkbox-pop 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

Note what was removed from the previous version: the `@custom-variant dark (&:is(.dark *));` line and the entire `.dark { ... }` block. This app never toggled a `.dark` class (no theme switcher exists), so that block was already dead scaffold CSS — removing it is part of the confirmed single-theme decision, not unrelated cleanup.

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: succeeds. Nothing consumes the new tokens yet, so the app will look broken/mixed (old component code still references `zinc-*`/`dark:*` classes that now point at a warm `--background`) until later tasks — that's expected at this checkpoint.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Add v2 design tokens (warm palette, Unbounded/Manrope fonts, animations)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: TaskCard restyle

**Files:**
- Modify: `src/components/task-card.tsx`

**Interfaces:**
- Consumes: tokens from Task 1.
- Produces: `TaskCard` gains a new optional prop `animationDelayMs?: number` (defaults to `0`). Task 4 passes this per-card for the stagger effect.

- [ ] **Step 1: Rewrite TaskCard**

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
```

Note on `justChecked`/`animate-checkbox-pop`: because Today's soft-complete removes a completed task from the list immediately (confirmed, no fade-out), this spring animation on the checkbox has almost no time to become visible before the whole card unmounts — this is expected given that architecture, not a bug to chase in Task 7's verification.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Restyle TaskCard with v2 tokens, spring checkbox, stagger support

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: CaptureSheet restyle + copy

**Files:**
- Modify: `src/components/capture-sheet.tsx`

**Interfaces:** no prop changes — same `{ open, onOpenChange, text, onTextChange, onParsed }`.

- [ ] **Step 1: Rewrite CaptureSheet**

`src/components/capture-sheet.tsx`:
```tsx
"use client";

import { useEffect, useRef, useState } from "react";
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
      <DrawerContent
        initialFocus={textareaRef}
        className="rounded-t-[28px] shadow-[0_-12px_40px_rgba(28,24,21,0.18)]"
      >
        <DrawerHeader>
          <DrawerTitle className="text-center text-lg font-semibold tracking-tight">
            Що в голові?
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex flex-col gap-3 px-4 pb-6">
          <Textarea
            ref={textareaRef}
            value={text}
            onChange={(event) => onTextChange(event.target.value)}
            placeholder="Пиши все підряд, ми в цьому розберемось..."
            rows={5}
            className="rounded-input border-accent-border bg-accent-tint text-base text-text-primary placeholder:text-text-tertiary"
            disabled={status === "loading"}
          />
          <p className="text-sm text-text-tertiary">
            AI визначить пріоритет, час і категорію сам
          </p>
          {status === "error" && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={text.trim().length === 0 || status === "loading"}
            className="rounded-input font-semibold transition-transform duration-150 active:scale-[0.98] active:bg-accent-hover"
          >
            {status === "loading" ? "Ми будуємо твій план..." : "Обробити"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
```

`Button`'s default variant now renders accent-colored automatically (Task 1's `--primary` override) — no explicit `bg-accent` needed here.

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Manually verify the new copy**

```bash
npm run dev
```

Open Capture — confirm the textarea placeholder reads "Пиши все підряд, ми в цьому розберемось..." and the hint line below reads "AI визначить пріоритет, час і категорію сам". Confirm the sheet background/border/shadow look warm (not the old flat white/black).

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Restyle Capture sheet with v2 tokens and updated placeholder/hint copy

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Today screen restyle (page.tsx)

**Files:**
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `TaskCard`'s new `animationDelayMs` prop (Task 2).

- [ ] **Step 1: Update the Today JSX (state/handlers above `return` are unchanged)**

In `src/app/page.tsx`, add a constant near the top:
```ts
const STAGGER_STEP_MS = 40;
```

Then replace everything from `if (tasks === null ...)` through the end of the file with:
```tsx
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
    <div className="flex min-h-screen flex-col bg-bg-base">
      <header className="flex items-start justify-between px-4 pt-8 pb-4">
        <div>
          <h1 className="text-[32px] leading-9 font-bold tracking-tight text-text-primary">
            Сьогодні
          </h1>
          <p className="mt-1 text-sm font-medium capitalize text-text-secondary">
            {todayLabel()}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setScreen("settings")}
          aria-label="Налаштування"
          className="mt-1.5 text-text-secondary transition-transform duration-150 active:scale-95"
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
          <div className="flex flex-col gap-3">
            {visibleTasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggleDone={handleComplete}
                animationDelayMs={index * STAGGER_STEP_MS}
              />
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-6 right-4">
        {visibleTasks.length === 0 && (
          <span className="animate-pulse-ring absolute inset-0 rounded-full bg-accent-tint" />
        )}
        <button
          type="button"
          onClick={() => setSheetOpen(true)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-accent text-2xl text-white shadow-[0_10px_24px_rgba(181,80,47,0.35)] transition-transform duration-150 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:scale-105 active:scale-95"
          aria-label="Додати задачі"
        >
          +
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

Note: the FAB's pulse indicator changed from a Tailwind `animate-pulse` class on the button itself to a separate absolutely-positioned ring element behind it (`animate-pulse-ring`), matching the mockup's two-layer approach (button never changes opacity/size on its own; the ring behind it expands and fades).

- [ ] **Step 2: Verify build**

```bash
npm run build
```

- [ ] **Step 3: Manually verify Today**

```bash
npm run dev
```

1. Confirm H1 reads "Сьогодні", warm cream background, terracotta FAB with tinted shadow.
2. With an empty task list, confirm the pulsing ring animates behind the FAB (not the button itself blinking).
3. Add 3+ tasks, confirm they appear staggered (not all at once) — a fast screen recording or DevTools "Animations" panel can help see this if it's too quick to eyeball.
4. Hover the FAB (desktop) — confirm it scales up slightly; click and hold — confirm it scales down.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Restyle Today screen: v2 tokens, Ukrainian H1, pulse-ring FAB, stagger

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Settings + Inbox restyle

**Files:**
- Modify: `src/components/settings-screen.tsx`
- Modify: `src/components/inbox-screen.tsx`

**Interfaces:** no prop changes to either component.

- [ ] **Step 1: Rewrite SettingsScreen**

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
    <div className="flex min-h-screen flex-col bg-bg-base">
      <header className="flex items-center gap-3 px-4 pt-8 pb-4">
        <button
          type="button"
          onClick={onBack}
          aria-label="Назад"
          className="text-2xl text-text-primary transition-transform duration-150 active:scale-95"
        >
          ←
        </button>
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          Налаштування
        </h1>
      </header>

      <main className="flex-1 px-4">
        <label className="flex items-center justify-between gap-4 rounded-card bg-surface p-4">
          <span className="text-base font-medium text-text-primary">
            Переглядати задачі перед додаванням
          </span>
          <Switch checked={inboxEnabled} onCheckedChange={onToggleInbox} />
        </label>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite InboxScreen**

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

function pillClass(selected: boolean): string {
  return `rounded-full px-3 py-1 text-xs font-semibold transition-colors duration-150 ${
    selected
      ? "border border-accent bg-accent-tint text-accent"
      : "border border-transparent bg-[#F0EBE3] text-text-secondary hover:bg-accent-tint hover:text-accent"
  }`;
}

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
        <h1 className="text-xl font-semibold tracking-tight text-text-primary">
          Ось що ми знайшли
        </h1>
      </header>

      <main className="flex-1 space-y-3 px-4 pb-28">
        {tasks.map((task, index) => (
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
              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label="Опції задачі"
                  className="shrink-0 rounded-full p-2 text-text-secondary hover:bg-[#F0EBE3]"
                >
                  <MoreVertical size={18} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => onDeleteTask(index)}
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
                  className={pillClass(task.priority === option.value)}
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
                  className={pillClass(task.label === option.value)}
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
                  className={pillClass(task.deadline === option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
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

- [ ] **Step 3: Verify build**

```bash
npm run build
```

- [ ] **Step 4: Manually verify**

```bash
npm run dev
```

Enable Inbox in Settings, submit text with 2+ tasks. In Inbox: confirm pill buttons show an `accent-tint` background on hover before being tapped/selected, and the selected state uses the accent border/text (not the old solid-black selection). Confirm Settings' toggle-on state is terracotta, not the browser/library default.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Restyle Settings and Inbox screens with v2 tokens and Ukrainian title

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Welcome screen + Undo toast restyle

**Files:**
- Modify: `src/components/welcome-screen.tsx`
- Modify: `src/components/undo-toast.tsx`

**Interfaces:** no prop changes to either component.

- [ ] **Step 1: Rewrite WelcomeScreen**

`src/components/welcome-screen.tsx`:
```tsx
"use client";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-base px-8 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-text-primary">
        AI Day Planner
      </h1>
      <p className="max-w-xs text-lg text-text-secondary">
        Розкажи все, що в голові. Ми складемо план на день
      </p>
      <button
        type="button"
        onClick={onStart}
        className="rounded-full bg-accent px-8 py-3 text-base font-semibold text-white transition-transform duration-150 active:scale-[0.98] active:bg-accent-hover"
      >
        Почати
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Rewrite UndoToast**

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
      className="animate-toast-in fixed inset-x-4 bottom-24 z-40 rounded-card bg-[#1C1815] px-4 py-3 shadow-[0_14px_34px_rgba(28,24,21,0.28)]"
    >
      <button
        type="button"
        onClick={onUndo}
        className="block text-base font-bold text-[#F0A98A]"
      >
        Скасувати
      </button>
      <p className="text-sm text-[#B0A79E]">Виконано</p>
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

Clear `localStorage` and reload — confirm Welcome screen uses the new fonts/colors. Complete a task on Today — confirm the undo toast slides/springs in and uses the warm dark background with the tinted "Скасувати" text.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "$(cat <<'EOF'
Restyle Welcome screen and undo toast with v2 tokens

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Push, deploy, and full visual verification

**Files:** none (operational task).

- [ ] **Step 1: Push to GitHub**

```bash
git push origin main
```

Confirm in the Vercel dashboard that the deployment reaches **Ready**.

- [ ] **Step 2: Side-by-side comparison with the mockup**

Open `design_mockup_v2.html` (from the designer's output folder) in one browser tab and the live Vercel URL in another. Compare Today and Capture side-by-side: background warmth, card radius/shadow-absence, priority dot size/color, FAB color and shadow, Capture sheet colors and copy.

- [ ] **Step 3: Full flow regression on the live URL**

Walk through, on a real phone if possible:
1. Welcome (fresh `localStorage`) → Today empty state → pulsing ring FAB.
2. Capture → new placeholder/hint copy → submit → tasks appear staggered in Today.
3. Complete a task → undo toast (spring-in, dark warm background) → undo → task reappears sorted correctly.
4. Settings → "Налаштування" title, terracotta toggle → enable Inbox.
5. Capture again → Inbox screen → pill hover-tint state → delete one task via "⋮" → set a deadline pill → "Додати все в Today".
6. Confirm nothing from Phases 2-4 or the post-audit fixes regressed (sorting, soft-complete, backdrop click-through guard, AI prompt time behavior).

Report back with the outcome — if any screen looks visibly off from the mockup or any prior functionality broke, stop and flag it rather than treating this phase as done.
