import { Compass, ListTodo, CalendarDays, FolderKanban, Target } from "lucide-react";

export const NAV = [
  { href: "/dashboard", label: "Aujourd'hui", icon: Compass, accent: "var(--color-compass)" },
  { href: "/tasks", label: "Tâches", icon: ListTodo, accent: "var(--color-tasks)" },
  { href: "/calendar", label: "Calendrier", icon: CalendarDays, accent: "var(--color-calendar)" },
  { href: "/projects", label: "Projets", icon: FolderKanban, accent: "var(--color-projects)" },
  { href: "/objectives", label: "Objectifs", icon: Target, accent: "var(--color-objectives)" },
];
