import type { SubmissionStatus } from "@/types/domain";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export const DEMO_TODAY = "2026-09-21";

export function parseIsoDate(iso: string): Date {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function addDays(iso: string, days: number): string {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

export function diffDays(fromIso: string, toIso: string): number {
  const from = parseIsoDate(fromIso).getTime();
  const to = parseIsoDate(toIso).getTime();
  return Math.round((to - from) / 86_400_000);
}

export function formatCompletedDate(completedOn: string | null): string {
  if (!completedOn) return "—";
  const date = parseIsoDate(completedOn);
  return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
}

function compactSpan(days: number): string {
  if (days < 7) return `${days}d`;
  const weeks = Math.max(1, Math.round(days / 7));
  return weeks === 1 ? "1wk" : `${weeks}wks`;
}

function dueInSpan(days: number): string {
  if (days === 1) return "due in 1 day";
  if (days < 7) return `due in ${days} days`;
  const weeks = Math.max(1, Math.round(days / 7));
  return weeks === 1 ? "due in 1 wk" : `due in ${weeks} wks`;
}

/**
 * TODO: This timeline-status logic belongs to the backend, but we use it here
 * so that the data presentation in the table is meaningful.
 */
export function timelineStatusDays(
  completedOn: string | null,
  dueOn: string,
  asOfIso: string = DEMO_TODAY,
): number {
  if (completedOn) return diffDays(dueOn, completedOn);
  return -diffDays(asOfIso, dueOn);
}

export function formatTimelineStatus(
  completedOn: string | null,
  dueOn: string,
  asOfIso: string = DEMO_TODAY,
): string {
  if (completedOn) return formatTimelineFromDays(timelineStatusDays(completedOn, dueOn, asOfIso));

  const untilDue = diffDays(asOfIso, dueOn);
  if (untilDue > 0) return dueInSpan(untilDue);
  if (untilDue === 0) return "due today";
  return `${compactSpan(-untilDue)} late`;
}

export function formatTimelineFromDays(days: number): string {
  const whole = Math.round(days);
  if (whole === 0) return "on time";
  if (whole < 0) return `${compactSpan(-whole)} early`;
  return `${compactSpan(whole)} late`;
}

export function formatDayCount(days: number): string {
  const whole = Math.abs(Math.round(days));
  return whole === 1 ? "1 day" : `${whole} days`;
}

export function medianNumber(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * TODO: This last-notified logic belongs to the backend, but we use it here
 * so that the data presentation in the table is meaningful.
 */
export function formatLastNotified(
  statusChangedOn: string | null,
  submissionStatus: SubmissionStatus,
  asOfIso: string = DEMO_TODAY,
): string {
  if (submissionStatus === "Not started" || !statusChangedOn) return "N/A";

  const ago = diffDays(statusChangedOn, asOfIso);
  if (ago <= 0) return "Today";
  if (ago === 1) return "Yesterday";
  if (ago < 7) return `${ago}d ago`;
  if (ago < 14) return "1 wk ago";

  const date = parseIsoDate(statusChangedOn);
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

export function asOfDateForPeriod(dueOn: string, today: string = DEMO_TODAY): string {
  const daysAfterDue = diffDays(dueOn, today);
  if (daysAfterDue <= 10) return today;
  return addDays(dueOn, 3);
}
