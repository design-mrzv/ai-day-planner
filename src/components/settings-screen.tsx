"use client";

import { HelpCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DayMode } from "@/lib/types";

interface SettingsScreenProps {
  inboxEnabled: boolean;
  onToggleInbox: (value: boolean) => void;
  dayMode: DayMode;
  onChangeDayMode: (mode: DayMode) => void;
  onBack: () => void;
}

const DAY_MODE_OPTIONS: { value: DayMode; label: string }[] = [
  { value: "focus", label: "Фокус" },
  { value: "admin", label: "Адмін" },
];

export function SettingsScreen({
  inboxEnabled,
  onToggleInbox,
  dayMode,
  onChangeDayMode,
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

      <main className="flex flex-col gap-3 px-4">
        <label className="flex items-center justify-between gap-4 rounded-card bg-surface p-4">
          <span className="text-base font-medium text-text-primary">
            Переглядати задачі перед додаванням
          </span>
          <Switch checked={inboxEnabled} onCheckedChange={onToggleInbox} />
        </label>

        <div className="flex items-center justify-between gap-4 rounded-card bg-surface p-4">
          <span className="flex items-center gap-1.5 text-base font-medium text-text-primary">
            Режим дня
            <DropdownMenu>
              <DropdownMenuTrigger aria-label="Що таке режим дня">
                <HelpCircle size={16} className="text-text-tertiary" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-64 p-3">
                <p className="text-sm text-text-primary">
                  <span className="font-semibold">Фокус-день</span> — пріоритезує
                  складні задачі, що потребують зосередження.
                </p>
                <p className="mt-2 text-sm text-text-primary">
                  <span className="font-semibold">Адмін-день</span> — пріоритезує
                  дрібні швидкі справи: дзвінки, покупки, листування.
                </p>
              </DropdownMenuContent>
            </DropdownMenu>
          </span>
          <div className="flex rounded-full bg-[#F0EBE3] p-1">
            {DAY_MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChangeDayMode(option.value)}
                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                  dayMode === option.value
                    ? "bg-accent text-white"
                    : "text-text-secondary"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
