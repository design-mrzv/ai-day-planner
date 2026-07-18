import { Task } from "./types";

export const seedTasks: Task[] = [
  {
    id: "seed-1",
    title: "Здати звіт",
    priority: "high",
    deadline: "tomorrow",
    time: null,
    label: "work",
    description: null,
    done: false,
  },
  {
    id: "seed-2",
    title: "Купити продукти",
    priority: "low",
    deadline: "today",
    time: null,
    label: "personal",
    description: "після роботи",
    done: false,
  },
];
