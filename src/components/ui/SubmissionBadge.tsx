import type { SubmissionStatus } from "@/types/domain";

const TONE: Record<Exclude<SubmissionStatus, "Not started">, string> = {
  Complete: "success",
  "In review": "queue",
  "Awaiting review": "active",
  "Missing/flagged": "error",
};

export function SubmissionBadge({ status }: { status: SubmissionStatus }) {
  if (status === "Not started") {
    return <span className="status-idle">Not started</span>;
  }

  return <span className={`status-badge ${TONE[status]}`}>{status}</span>;
}
