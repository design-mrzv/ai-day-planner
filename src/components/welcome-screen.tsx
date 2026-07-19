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
