import { useQuery } from "@tanstack/react-query";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { useAppSelector } from "@/app/hooks";
import type { SubmissionStatus } from "@/types/domain";

export type BackboneProviderRow = {
  id: number;
  name: string;
  submissionStatus: SubmissionStatus;
};

export type BackboneHomeSummary = {
  isLoading: boolean;
  error: Error | null;
  name: string;
  trainingProviderCount: number;
  providers: BackboneProviderRow[];
};

export function useBackboneHome(): BackboneHomeSummary {
  const entityId = useAppSelector((state) => state.auth.identity?.entityId ?? "");
  const periodId = useAppSelector((state) => state.workspace.selectedPeriodId);
  const query = useQuery({
    queryKey: queryKeys.backboneHome(entityId, periodId),
    queryFn: () => reportingApi.getBackboneHome(entityId, periodId),
    enabled: Boolean(entityId),
  });

  return {
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : query.error ? new Error("Failed to load workspace") : null,
    name: query.data?.name ?? "Backbone",
    trainingProviderCount: query.data?.trainingProviderCount ?? 0,
    providers: query.data?.providers ?? [],
  };
}
