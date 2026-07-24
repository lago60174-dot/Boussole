import { format, isPast, isToday, isTomorrow, differenceInCalendarDays } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Parse une date en tenant compte du format "date-only" (yyyy-MM-dd, sans
 * heure ni fuseau — tel que renvoyé par les colonnes Postgres `date` :
 * tasks.start_date, projects.target_date, objectives.period_start/end...).
 *
 * `new Date("2026-07-31")` seul est piégeux : ce format est interprété par
 * le moteur JS comme minuit **UTC**, ce qui décale le jour affiché d'un jour
 * en arrière dans les fuseaux horaires négatifs (continent américain). On
 * force ici un parsing en minuit **local** pour ces chaînes date-only, qui
 * sont sans ambiguïté un jour calendaire et non un instant précis.
 */
export function parseFlexibleDate(date: string | Date): Date {
  if (date instanceof Date) return date;
  if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [y, m, d] = date.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  return new Date(date);
}

export function formatDateFr(date: string | Date, pattern = "d MMM yyyy"): string {
  return format(parseFlexibleDate(date), pattern, { locale: fr });
}

export function formatTimeFr(date: string | Date): string {
  return format(parseFlexibleDate(date), "HH:mm", { locale: fr });
}

/** Étiquette relative courte pour une échéance : "Aujourd'hui", "Demain", "En retard", ou une date. */
export function relativeDueLabel(dueDate: string | Date): { label: string; overdue: boolean } {
  const d = parseFlexibleDate(dueDate);
  if (isToday(d)) return { label: "Aujourd'hui", overdue: false };
  if (isTomorrow(d)) return { label: "Demain", overdue: false };
  if (isPast(d)) {
    const days = Math.abs(differenceInCalendarDays(d, new Date()));
    return { label: `En retard de ${days} j`, overdue: true };
  }
  const days = differenceInCalendarDays(d, new Date());
  if (days <= 6) return { label: format(d, "EEEE", { locale: fr }), overdue: false };
  return { label: format(d, "d MMM", { locale: fr }), overdue: false };
}

/**
 * Décalage (en minutes, à ajouter à un instant UTC) entre UTC et `timeZone`
 * pour un instant donné. Gère l'heure d'été automatiquement.
 */
function getTimezoneOffsetMinutes(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = Object.fromEntries(dtf.formatToParts(date).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );
  return (asUtc - date.getTime()) / 60_000;
}

/**
 * Bornes ISO (instants UTC) du jour calendaire "aujourd'hui" tel que vécu
 * dans `timeZone` (le fuseau du profil utilisateur), et non dans le fuseau
 * du serveur qui exécute le code.
 *
 * Important : sur Vercel, les fonctions serverless tournent en UTC quel que
 * soit l'endroit où vit l'utilisateur. Utiliser `new Date().setHours(0,0,0,0)`
 * dans un Server Component calcule donc minuit **UTC**, pas minuit dans le
 * fuseau de l'utilisateur — ce qui peut classer les tâches proches de minuit
 * dans le mauvais jour selon le fuseau (1h de décalage pour l'Afrique
 * centrale/de l'Ouest, bien plus pour d'autres régions).
 */
export function todayBoundsInTimezone(timeZone: string, now: Date = new Date()): { start: string; end: string } {
  const offsetMin = getTimezoneOffsetMinutes(timeZone, now);
  const localNow = new Date(now.getTime() + offsetMin * 60_000);
  const localMidnight = new Date(
    Date.UTC(localNow.getUTCFullYear(), localNow.getUTCMonth(), localNow.getUTCDate(), 0, 0, 0, 0)
  );
  const startUtc = new Date(localMidnight.getTime() - offsetMin * 60_000);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start: startUtc.toISOString(), end: endUtc.toISOString() };
}
