import type { MonthlyPackageStatus } from "@/types/submissions";

const TONE: Record<MonthlyPackageStatus, string> = {
  "Action Needed": "queue",
  Submitted: "success",
  Approved: "approved",
};

export function PackageStatusBadge({ status }: { status: MonthlyPackageStatus }) {
  return <span className={`status-badge ${TONE[status]}`}>{status}</span>;
}
