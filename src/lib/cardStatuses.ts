import type { SubmissionStatus } from "@/types/domain";
import type { MonthlyPackageStatus } from "@/types/submissions";

export function cardStatuses(
  packageStatus: MonthlyPackageStatus,
  submissionStatus: SubmissionStatus,
): { status: MonthlyPackageStatus; reviewStatus: SubmissionStatus | null } {
  if (submissionStatus === "Missing/flagged") {
    return { status: "Action Needed", reviewStatus: "Missing/flagged" };
  }
  if (submissionStatus === "Complete") {
    return { status: "Approved", reviewStatus: null };
  }
  if (packageStatus === "Submitted") {
    return { status: "Submitted", reviewStatus: submissionStatus };
  }
  return { status: packageStatus, reviewStatus: null };
}
