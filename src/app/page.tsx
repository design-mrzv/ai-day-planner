"use client";

import { useState } from "react";
import { TaskCard } from "@/components/task-card";
import { seedTasks } from "@/lib/seed-tasks";
import { Task } from "@/lib/types";

function todayLabel(): string {
  return new Intl.DateTimeFormat("uk-UA", {
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>(seedTasks);

  function handleToggleDone(id: string) {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task))
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
        className={`fixed bottom-6 right-5 flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-2xl text-white shadow-lg dark:bg-zinc-50 dark:text-zinc-900 ${
          tasks.length === 0 ? "animate-pulse" : ""
        }`}
        aria-label="Додати задачі"
      >
        +
      </button>
    </div>
  );
}
