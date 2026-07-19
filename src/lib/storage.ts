import { Task } from "./types";

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
