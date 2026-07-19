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
