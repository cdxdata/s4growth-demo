export type PeriodKind = "monthly" | "quarterly";

export type ReportingPeriod = {
  id: string;
  kind: PeriodKind;
  year: number;
  month?: number;
  quarter?: 2 | 3;
  label: string;
  dueDateLong?: string;
  windowLabel: string;
};

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

const QUARTER_MONTHS: Record<2 | 3, [number, number, number]> = {
  2: [4, 5, 6],
  3: [7, 8, 9],
};

function thirdThursday(year: number, month: number): Date {
  const first = new Date(year, month - 1, 1);
  const firstThursday = 1 + ((4 - first.getDay() + 7) % 7);
  return new Date(year, month - 1, firstThursday + 14);
}

function formatDueShort(date: Date): string {
  return `${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
}

function formatDueLong(date: Date): string {
  return `${MONTH_NAMES[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function makeMonthlyPeriod(year: number, month: number): ReportingPeriod {
  const due = thirdThursday(year, month);
  const monthName = MONTH_NAMES[month - 1];
  return {
    id: `${year}-${String(month).padStart(2, "0")}`,
    kind: "monthly",
    year,
    month,
    label: `${monthName} ${year} ⋅ Monthly (due ${formatDueShort(due)})`,
    dueDateLong: formatDueLong(due),
    windowLabel: `${monthName} ${year}`,
  };
}

function makeQuarterlyPeriod(year: number, quarter: 2 | 3): ReportingPeriod {
  const months = QUARTER_MONTHS[quarter];
  const start = MONTH_SHORT[months[0] - 1];
  const end = MONTH_SHORT[months[2] - 1];
  const startLong = MONTH_NAMES[months[0] - 1];
  const endLong = MONTH_NAMES[months[2] - 1];
  return {
    id: `${year}-q${quarter}`,
    kind: "quarterly",
    year,
    quarter,
    label: `Q${quarter} ${year} ⋅ ${start} - ${end} ⋅ Quarterly`,
    windowLabel: `${startLong} – ${endLong} ${year}`,
  };
}

export const REPORTING_PERIODS: ReportingPeriod[] = [
  makeQuarterlyPeriod(2026, 3),
  makeMonthlyPeriod(2026, 9),
  makeMonthlyPeriod(2026, 8),
  makeMonthlyPeriod(2026, 7),
  makeQuarterlyPeriod(2026, 2),
  makeMonthlyPeriod(2026, 6),
  makeMonthlyPeriod(2026, 5),
  makeMonthlyPeriod(2026, 4),
];

export const DEFAULT_PERIOD_ID = "2026-09";

export function getPeriodById(id: string): ReportingPeriod {
  return REPORTING_PERIODS.find((period) => period.id === id) ?? REPORTING_PERIODS[1];
}

export function getContainingQuarter(period: ReportingPeriod): ReportingPeriod {
  if (period.kind === "quarterly") return period;
  const quarter = period.month && period.month >= 7 ? 3 : 2;
  return getPeriodById(`${period.year}-q${quarter}`);
}

export function getPeriodDueDate(period: ReportingPeriod): Date {
  if (period.kind === "monthly" && period.month) {
    return thirdThursday(period.year, period.month);
  }
  const endMonth = period.quarter === 2 ? 6 : 9;
  return new Date(period.year, endMonth, 0);
}

export function getPeriodDueIso(period: ReportingPeriod): string {
  const date = getPeriodDueDate(period);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getPreviousBaselineName(period: ReportingPeriod): string {
  if (period.kind === "quarterly") {
    const previousQuarter = (period.quarter ?? 2) - 1;
    return `Q${previousQuarter}`;
  }
  const month = period.month ?? 1;
  const previousMonth = month === 1 ? 12 : month - 1;
  return MONTH_NAMES[previousMonth - 1];
}

export function getCurrentBaselineName(period: ReportingPeriod): string {
  if (period.kind === "quarterly") return `Q${period.quarter ?? 2}`;
  return MONTH_NAMES[(period.month ?? 1) - 1];
}
