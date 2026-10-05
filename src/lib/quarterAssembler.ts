import { MONTH_NAMES, type ReportingPeriod } from "@/constants/periods";
import { isProviderId } from "@/lib/providerScope";
import { technicalHasStarted, technicalNarratives } from "@/lib/technicalReport";
import type { QuarterlyDraft } from "@/types/domain";
import type { PeriodSubmissionRecord } from "@/types/submissions";

export type QuarterSource = {
  periodId: string;
  label: string;
  status: PeriodSubmissionRecord["status"];
};

export type AssembledQuarter = QuarterlyDraft & {
  sources: QuarterSource[];
};

function number(value: string | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sumRows<T>(rows: T[], select: (row: T) => number): number {
  return rows.reduce((total, row) => total + select(row), 0);
}

export function quarterMonthIds(quarter: ReportingPeriod): string[] {
  const finalMonth = quarter.quarter === 2 ? 6 : 9;
  return [finalMonth - 2, finalMonth - 1, finalMonth].map(
    (month) => `${quarter.year}-${String(month).padStart(2, "0")}`,
  );
}

function assembleFromSelected(
  quarter: ReportingPeriod,
  selected: Array<{ periodId: string; record: PeriodSubmissionRecord }>,
): AssembledQuarter {
  const enrolled = selected.reduce(
    (total, item) => total + sumRows(item.record.eda.admissions, (row) => number(row.enrolled)),
    0,
  );
  const completions = selected.reduce(
    (total, item) => total + sumRows(item.record.eda.completions, (row) => number(row.completed)),
    0,
  );
  const placements = selected.reduce(
    (total, item) =>
      total +
      sumRows(item.record.eda.employmentType, (row) =>
        number(row.types.fullTime) +
        number(row.types.partTime) +
        number(row.types.seasonal) +
        number(row.types.earnAndLearn) +
        number(row.types.other),
      ),
    0,
  );

  const narratives = selected
    .filter((item) => technicalHasStarted(item.record.technical))
    .map((item) => ({ periodId: item.periodId, ...technicalNarratives(item.record.technical) }));

  const join = (key: "achievements" | "challenges" | "plan") =>
    narratives
      .map((item) => item[key])
      .filter((value) => value && value !== "None")
      .join("\n\n") || "No submitted narrative for this quarter.";

  const story = narratives.map((item) => item.story).find((value) => value && value !== "None");

  return {
    enrolled,
    completions,
    placements,
    achievements: join("achievements"),
    challenges: join("challenges"),
    plan: join("plan"),
    quote: story || "No participant testimonial was submitted for this quarter.",
    fromIntake: narratives.length > 0,
    sources: uniqueSources(quarter, selected),
  };
}

function uniqueSources(
  quarter: ReportingPeriod,
  selected: Array<{ periodId: string; record: PeriodSubmissionRecord }>,
): QuarterSource[] {
  const seen = new Map<string, PeriodSubmissionRecord["status"]>();
  for (const item of selected) {
    if (!seen.has(item.periodId)) seen.set(item.periodId, item.record.status);
  }
  return [...seen.entries()].map(([periodId, status]) => ({
    periodId,
    label: `${MONTH_NAMES[Number(periodId.slice(-2)) - 1]} ${quarter.year}`,
    status,
  }));
}

function monthRecords(
  records: Record<string, PeriodSubmissionRecord>,
  ids: string[],
): Array<{ periodId: string; record: PeriodSubmissionRecord }> {
  return ids
    .map((periodId) => ({ periodId, record: records[periodId] }))
    .filter((item): item is { periodId: string; record: PeriodSubmissionRecord } => Boolean(item.record));
}

export function assembleQuarter(
  quarter: ReportingPeriod,
  records: Record<string, PeriodSubmissionRecord>,
): AssembledQuarter {
  return assembleFromSelected(quarter, monthRecords(records, quarterMonthIds(quarter)));
}

export function assembleQuarterScope(
  quarter: ReportingPeriod,
  byProvider: Record<string, Record<string, PeriodSubmissionRecord>>,
  providerId: number | null,
): AssembledQuarter {
  const ids = quarterMonthIds(quarter);
  const bags = isProviderId(providerId) ? [byProvider[String(providerId)] ?? {}] : Object.values(byProvider);
  return assembleFromSelected(
    quarter,
    bags.flatMap((records) => monthRecords(records, ids)),
  );
}

export function recordsForWorkbook(
  byProvider: Record<string, Record<string, PeriodSubmissionRecord>>,
  providerId: number | null,
): Record<string, PeriodSubmissionRecord> {
  if (isProviderId(providerId)) return byProvider[String(providerId)] ?? {};
  const out: Record<string, PeriodSubmissionRecord> = {};
  for (const [id, periods] of Object.entries(byProvider)) {
    for (const [periodId, record] of Object.entries(periods)) {
      out[`${id}:${periodId}`] = record;
    }
  }
  return out;
}
