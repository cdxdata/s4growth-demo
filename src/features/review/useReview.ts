import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { useAppSelector } from "@/app/hooks";
import type { SubmissionStatus } from "@/types/domain";

const REVIEW_QUEUE_STATUSES = new Set<SubmissionStatus>(["In review", "Awaiting review"]);

export type ReviewQueueItem = {
  id: number;
  label: string;
  text: string;
  status: SubmissionStatus;
};

export type ReviewSummary = {
  isLoading: boolean;
  error: Error | null;
  queue: ReviewQueueItem[];
  openMonthly: (id: number) => void;
};

export function useReview(): ReviewSummary {
  const navigate = useNavigate();
  const periodId = useAppSelector((state) => state.workspace.selectedPeriodId);
  const storedStatuses = useAppSelector((state) => state.submissions.providerStatus[periodId] ?? {});
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard(periodId),
    queryFn: () => reportingApi.getDashboard(periodId),
  });

  const queue = useMemo(
    () =>
      (dashboardQuery.data?.providers ?? []).flatMap((provider) => {
        const status = storedStatuses[String(provider.id)]?.status ?? provider.submissionStatus;
        if (!REVIEW_QUEUE_STATUSES.has(status)) return [];
        return [
          {
            id: provider.id,
            label: provider.name,
            text: provider.backbone ? `via ${provider.backbone}` : provider.program,
            status,
          },
        ];
      }),
    [dashboardQuery.data?.providers, storedStatuses],
  );

  return {
    isLoading: dashboardQuery.isLoading && !dashboardQuery.data,
    error:
      dashboardQuery.error instanceof Error
        ? dashboardQuery.error
        : dashboardQuery.error
          ? new Error("Failed to load review queue")
          : null,
    queue,
    openMonthly(id) {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      navigate(`/providers/${id}?tab=monthly`);
    },
  };
}
