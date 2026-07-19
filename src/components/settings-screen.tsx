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
