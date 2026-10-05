import type { SubmissionStatus } from "@/types/domain";
import type { ProviderPeriodStatus } from "@/types/submissions";

export function overlayStoredStatus(input: {
  submissionStatus: SubmissionStatus;
  completedOn: string | null;
  statusChangedOn: string | null;
  stored?: ProviderPeriodStatus;
}): {
  submissionStatus: SubmissionStatus;
  completedOn: string | null;
  statusChangedOn: string | null;
} {
  return {
    submissionStatus: input.stored?.status ?? input.submissionStatus,
    completedOn: input.stored?.completedOn ?? input.completedOn,
    statusChangedOn: input.stored?.statusChangedOn ?? input.statusChangedOn,
  };
}

export function dashboardStatusCounts(statuses: readonly SubmissionStatus[]) {
  let completeCount = 0;
  let awaitingReview = 0;
  let inReview = 0;
  let missingFlagged = 0;
  let notStarted = 0;
  for (const status of statuses) {
    if (status === "Complete") completeCount += 1;
    else if (status === "Awaiting review") awaitingReview += 1;
    else if (status === "In review") inReview += 1;
    else if (status === "Missing/flagged") missingFlagged += 1;
    else if (status === "Not started") notStarted += 1;
  }
  return {
    completeCount,
    awaitingReview,
    inReview,
    needAttentionCount: awaitingReview + inReview,
    missingFlagged,
    notStarted,
    followUpCount: missingFlagged + notStarted,
  };
}
