import { Priority, Task } from "./types";

const PRIORITY_RANK: Record<Priority, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function sortTasks(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (a.time && b.time) {
      const diff = timeToMinutes(a.time) - timeToMinutes(b.time);
      if (diff !== 0) return diff;
      return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    }
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
  });
}
