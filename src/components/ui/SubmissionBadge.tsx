import type { SubmissionStatus } from "@/types/domain";

const TONE: Record<Exclude<SubmissionStatus, "Not started">, string> = {
  Complete: "success",
  "In review": "queue",
  "Awaiting review": "active",
  "Missing/flagged": "error",
};

export function SubmissionBadge({ status, compact }: { status: SubmissionStatus; compact?: boolean }) {
  const sizeClass = compact ? " is-sub" : "";
  if (status === "Not started") {
    return <span className={`status-idle${sizeClass}`}>Not started</span>;
  }

  return <span className={`status-badge ${TONE[status]}${sizeClass}`}>{status}</span>;
}
