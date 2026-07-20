"use client";

interface WelcomeScreenProps {
  onStart: () => void;
}

export function WelcomeScreen({ onStart }: WelcomeScreenProps) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-bg-base px-8 text-center">
      <div className="flex flex-col items-center">
        <img src="/logo.svg" alt="AI Day Planner" className="w-[144px]" />
        <p className="-mt-4 max-w-xs text-lg text-text-secondary">
          Розкажи все, що в голові. Ми складемо план на день
        </p>
      </div>
      <button
        type="button"
        onClick={onStart}
        className="h-14 w-full max-w-xs rounded-full bg-accent px-6 py-4 text-base font-semibold text-white transition-transform duration-150 active:scale-[0.98] active:bg-accent-hover"
      >
        Почати
      </button>
    </div>
  );
}
