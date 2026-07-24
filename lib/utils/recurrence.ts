import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  isBefore,
  isSameDay,
  isWithinInterval,
} from "date-fns";

/**
 * Format de récurrence simplifié stocké en base, par ex :
 *   "FREQ=DAILY;INTERVAL=1"
 *   "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE,FR"
 *   "FREQ=MONTHLY;INTERVAL=1"
 * Volontairement un sous-ensemble de la norme RFC 5545 (RRULE) —
 * suffisant pour un usage personnel, sans dépendance externe.
 */

export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type ParsedRecurrence = {
  freq: Frequency;
  interval: number;
  byDay?: string[]; // ["MO","TU","WE","TH","FR","SA","SU"]
};

const DAY_CODES = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
const DAY_LABELS_FR: Record<string, string> = {
  MO: "lun", TU: "mar", WE: "mer", TH: "jeu", FR: "ven", SA: "sam", SU: "dim",
};

export function parseRecurrenceRule(rule: string | null | undefined): ParsedRecurrence | null {
  if (!rule) return null;
  const parts = Object.fromEntries(
    rule.split(";").map((p) => p.split("=") as [string, string])
  );
  const freq = parts.FREQ as Frequency;
  if (!freq) return null;
  return {
    freq,
    interval: Number(parts.INTERVAL ?? 1) || 1,
    byDay: parts.BYDAY ? parts.BYDAY.split(",") : undefined,
  };
}

export function buildRecurrenceRule(parsed: ParsedRecurrence): string {
  let rule = `FREQ=${parsed.freq};INTERVAL=${parsed.interval}`;
  if (parsed.byDay?.length) rule += `;BYDAY=${parsed.byDay.join(",")}`;
  return rule;
}

const FREQ_LABEL: Record<Frequency, { plural: string; prefix: string }> = {
  DAILY: { plural: "jours", prefix: "Tous les" },
  WEEKLY: { plural: "semaines", prefix: "Toutes les" },
  MONTHLY: { plural: "mois", prefix: "Tous les" },
  YEARLY: { plural: "ans", prefix: "Tous les" },
};

export function formatRecurrenceLabel(rule: string | null | undefined): string {
  const parsed = parseRecurrenceRule(rule);
  if (!parsed) return "Ne se répète pas";

  const { plural, prefix } = FREQ_LABEL[parsed.freq];
  const base =
    parsed.interval === 1 ? `${prefix} ${plural}` : `${prefix} ${parsed.interval} ${plural}`;

  if (parsed.freq === "WEEKLY" && parsed.byDay?.length) {
    return `${base} (${parsed.byDay.map((d) => DAY_LABELS_FR[d]).join(", ")})`;
  }
  return base;
}

/** Calcule la prochaine occurrence strictement après `fromDate`. */
export function getNextOccurrence(fromDate: Date, rule: string): Date {
  const parsed = parseRecurrenceRule(rule);
  if (!parsed) return fromDate;

  switch (parsed.freq) {
    case "DAILY":
      return addDays(fromDate, parsed.interval);
    case "WEEKLY": {
      if (!parsed.byDay?.length) return addWeeks(fromDate, parsed.interval);
      // Cherche le prochain jour coché dans les 7 * interval jours suivants
      for (let i = 1; i <= 7 * parsed.interval + 7; i++) {
        const candidate = addDays(fromDate, i);
        const code = DAY_CODES[candidate.getDay()];
        if (parsed.byDay.includes(code)) return candidate;
      }
      return addWeeks(fromDate, parsed.interval);
    }
    case "MONTHLY":
      return addMonths(fromDate, parsed.interval);
    case "YEARLY":
      return addYears(fromDate, parsed.interval);
  }
}

/**
 * Développe les occurrences d'un événement récurrent dans un intervalle
 * donné (pour l'affichage du calendrier). Limité à 366 itérations de sécurité.
 */
export function expandOccurrences(
  startAt: Date,
  rule: string | null | undefined,
  rangeStart: Date,
  rangeEnd: Date
): Date[] {
  const parsed = parseRecurrenceRule(rule);
  if (!rule || !parsed) {
    // Pas de règle, ou règle présente mais non reconnue (donnée corrompue) :
    // traité comme un événement ponctuel plutôt que de boucler indéfiniment
    // sur la même date (getNextOccurrence renverrait fromDate inchangé).
    return isWithinInterval(startAt, { start: rangeStart, end: rangeEnd }) ? [startAt] : [];
  }

  const occurrences: Date[] = [];
  let current = startAt;
  let n = 0;

  while (isBefore(current, rangeEnd) && n < 366) {
    if (!isBefore(current, rangeStart)) {
      occurrences.push(current);
    }
    n++;
    // MONTHLY/YEARLY : toujours recalculer depuis l'ancre d'origine plutôt
    // que depuis la dernière occurrence. Sinon, un événement le 31 du mois
    // dérive définitivement au 28 dès qu'il traverse un février (addMonths
    // arrondit le 31 janvier au 28 février, puis 28 février + 1 mois = 28
    // mars, etc. — la date d'origine "31" est perdue à chaque itération).
    if (parsed.freq === "MONTHLY") {
      current = addMonths(startAt, n * parsed.interval);
    } else if (parsed.freq === "YEARLY") {
      current = addYears(startAt, n * parsed.interval);
    } else {
      current = getNextOccurrence(current, rule);
    }
  }

  return occurrences;
}

export const RECURRENCE_PRESETS: { label: string; value: string | null }[] = [
  { label: "Ne se répète pas", value: null },
  { label: "Tous les jours", value: "FREQ=DAILY;INTERVAL=1" },
  { label: "Toutes les semaines", value: "FREQ=WEEKLY;INTERVAL=1" },
  { label: "En semaine (lun-ven)", value: "FREQ=WEEKLY;INTERVAL=1;BYDAY=MO,TU,WE,TH,FR" },
  { label: "Toutes les 2 semaines", value: "FREQ=WEEKLY;INTERVAL=2" },
  { label: "Tous les mois", value: "FREQ=MONTHLY;INTERVAL=1" },
  { label: "Tous les ans", value: "FREQ=YEARLY;INTERVAL=1" },
];
