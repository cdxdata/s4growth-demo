import type { SubmissionStatus } from "@/types/domain";

export const SEPTEMBER_STATUSES: Record<number, SubmissionStatus> = {
  1: "Missing/flagged",
  2: "Complete",
  3: "Not started",
  4: "Complete",
  5: "In review",
  6: "Awaiting review",
  7: "Complete",
  8: "Not started",
  9: "Complete",
  10: "In review",
  11: "Awaiting review",
  12: "Missing/flagged",
  13: "Complete",
  14: "Not started",
  15: "In review",
};

export function demoStatusForPeriod(periodId: string, orgId: number): SubmissionStatus {
  if (periodId === "2026-09" || periodId === "2026-q3") {
    return SEPTEMBER_STATUSES[orgId] ?? "Not started";
  }
  return "Complete";
}
