export type TaskStatus = "todo" | "in_progress" | "done" | "cancelled";
export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";
export type ObjectiveStatus = "not_started" | "on_track" | "at_risk" | "behind" | "completed";
export type MetricType = "numeric" | "percentage" | "boolean";

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  status: ProjectStatus;
  start_date: string | null;
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface KeyResult {
  id: string;
  user_id: string;
  objective_id: string;
  title: string;
  metric_type: MetricType;
  start_value: number;
  target_value: number;
  current_value: number;
  unit: string | null;
  created_at: string;
  updated_at: string;
}

export interface Objective {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  description: string | null;
  status: ObjectiveStatus;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
  updated_at: string;
  key_results?: KeyResult[];
  progress_ratio?: number;
  project?: Pick<Project, "id" | "name" | "color"> | null;
}

export interface Task {
  id: string;
  user_id: string;
  project_id: string | null;
  key_result_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  start_date: string | null;
  due_date: string | null;
  duration_days: number;
  recurrence_rule: string | null;
  tags: string[];
  position: number;
  estimate_hours: number | null;
  reminder_minutes_before: number | null;
  reminder_sent_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  project?: Pick<Project, "id" | "name" | "color"> | null;
  subtasks?: Task[];
  dependencies?: string[]; // ids des tâches dont celle-ci dépend
}

export interface TaskDependency {
  id: string;
  user_id: string;
  task_id: string;
  depends_on_task_id: string;
}

export interface CalendarEvent {
  id: string;
  user_id: string;
  project_id: string | null;
  linked_task_id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  all_day: boolean;
  recurrence_rule: string | null;
  color: string;
  reminder_minutes_before: number | null;
  reminder_sent_at: string | null;
  created_at: string;
  updated_at: string;
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Haute",
  urgent: "Urgente",
};

export const PRIORITY_ORDER: Record<TaskPriority, number> = {
  urgent: 0,
  high: 1,
  medium: 2,
  low: 3,
};

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "À faire",
  in_progress: "En cours",
  done: "Terminée",
  cancelled: "Annulée",
};

export const OBJECTIVE_STATUS_LABELS: Record<ObjectiveStatus, string> = {
  not_started: "Pas commencé",
  on_track: "Sur la bonne voie",
  at_risk: "À risque",
  behind: "En retard",
  completed: "Atteint",
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: "Actif",
  on_hold: "En pause",
  completed: "Terminé",
  archived: "Archivé",
};
