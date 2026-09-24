import { useQuery } from "@tanstack/react-query";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { useAppSelector } from "@/app/hooks";
import { MONTH_NAMES, getPeriodById } from "@/constants/periods";
import { resolveProviderId } from "@/lib/providerScope";
import { participantsInTraining } from "@/lib/submissionDocuments";
import { getPeriodSubmission, getProviderPeriodStatus } from "@/store/submissionsSlice";
import type { SubmissionStatus } from "@/types/domain";

export type TrainingProviderHomeSummary = {
  isLoading: boolean;
  error: Error | null;
  name: string;
  monthName: string;
  participantsInTraining: number;
  programCount: number;
  programs: string[];
  submissionStatus: SubmissionStatus | null;
};

export function useTrainingProviderHome(): TrainingProviderHomeSummary {
  const identity = useAppSelector((state) => state.auth.identity);
  const entityId = identity?.entityId ?? "";
  const periodId = useAppSelector((state) => state.workspace.selectedPeriodId);
  const period = getPeriodById(periodId);
  const providerId = resolveProviderId(identity);
  const storedStatus = useAppSelector((state) => getProviderPeriodStatus(state.submissions, periodId, providerId));
  const record = useAppSelector((state) => getPeriodSubmission(state.submissions, periodId, providerId));
  const query = useQuery({
    queryKey: queryKeys.tpHome(entityId, periodId),
    queryFn: () => reportingApi.getTrainingProviderHome(entityId, periodId),
    enabled: Boolean(entityId),
  });

  return {
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : query.error ? new Error("Failed to load workspace") : null,
    name: query.data?.name ?? "Training provider",
    monthName: MONTH_NAMES[(period.month ?? 9) - 1],
    participantsInTraining: participantsInTraining(record.eda),
    programCount: query.data?.programs.length ?? 0,
    programs: query.data?.programs ?? [],
    submissionStatus: storedStatus?.status ?? query.data?.submissionStatus ?? null,
  };
}
