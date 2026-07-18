export type Priority = "high" | "medium" | "low";
export type Label = "work" | "personal";
export type Deadline = "today" | "tomorrow" | string | null;

export interface ParsedTask {
  title: string;
  priority: Priority;
  deadline: Deadline;
  time: string | null;
  label: Label;
  description: string | null;
}

export interface Task extends ParsedTask {
  id: string;
  done: boolean;
}
