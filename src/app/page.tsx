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
