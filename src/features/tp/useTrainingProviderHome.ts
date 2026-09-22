import { useQuery } from "@tanstack/react-query";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { useAppSelector } from "@/app/hooks";
import type { SubmissionStatus } from "@/types/domain";

export type TrainingProviderHomeSummary = {
  isLoading: boolean;
  error: Error | null;
  name: string;
  participantsInTraining: number;
  programCount: number;
  programs: string[];
  submissionStatus: SubmissionStatus | null;
};

export function useTrainingProviderHome(): TrainingProviderHomeSummary {
  const entityId = useAppSelector((state) => state.auth.identity?.entityId ?? "");
  const periodId = useAppSelector((state) => state.workspace.selectedPeriodId);
  const query = useQuery({
    queryKey: queryKeys.tpHome(entityId, periodId),
    queryFn: () => reportingApi.getTrainingProviderHome(entityId, periodId),
    enabled: Boolean(entityId),
  });

  return {
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : query.error ? new Error("Failed to load workspace") : null,
    name: query.data?.name ?? "Training provider",
    participantsInTraining: query.data?.participantsInTraining ?? 0,
    programCount: query.data?.programs.length ?? 0,
    programs: query.data?.programs ?? [],
    submissionStatus: query.data?.submissionStatus ?? null,
  };
}
