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

  // localStorage isn't available during SSR, so hydrating from it must
  // happen in an effect rather than a useState initializer.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setTasks(loadTasks());
    setOnboardingDone(loadOnboardingDone());
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
