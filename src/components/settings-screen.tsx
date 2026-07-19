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
        <h1 className="font-heading text-xl font-semibold tracking-tight text-text-primary">
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
