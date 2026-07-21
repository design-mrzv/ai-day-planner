import { DayMode, Task } from "./types";

const TASKS_KEY = "tasks";
const ONBOARDING_KEY = "onboarding_done";

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Task[]) : [];
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error("Failed to save tasks to localStorage", error);
  }
}

export function loadOnboardingDone(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveOnboardingDone(): void {
  try {
    localStorage.setItem(ONBOARDING_KEY, "true");
  } catch (error) {
    console.error("Failed to save onboarding flag to localStorage", error);
  }
}

const INBOX_KEY = "inbox_enabled";

export function loadInboxEnabled(): boolean {
  try {
    return localStorage.getItem(INBOX_KEY) === "true";
  } catch {
    return false;
  }
}

export function saveInboxEnabled(value: boolean): void {
  try {
    localStorage.setItem(INBOX_KEY, value ? "true" : "false");
  } catch (error) {
    console.error("Failed to save inbox setting to localStorage", error);
  }
}

const DAY_MODE_KEY = "day_mode";

export function loadDayMode(): DayMode {
  try {
    return localStorage.getItem(DAY_MODE_KEY) === "admin" ? "admin" : "focus";
  } catch {
    return "focus";
  }
}

export function saveDayMode(mode: DayMode): void {
  try {
    localStorage.setItem(DAY_MODE_KEY, mode);
  } catch (error) {
    console.error("Failed to save day mode to localStorage", error);
  }
}
