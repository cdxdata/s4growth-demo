import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import type { Participant } from "@/types/domain";

export type ParticipantsSummary = {
  isLoading: boolean;
  error: Error | null;
  imported: boolean;
  importing: boolean;
  records: Participant[];
  metrics: Array<{ value: number; label: string }>;
  runImport: () => void;
};

export function useParticipants(): ParticipantsSummary {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.participants,
    queryFn: reportingApi.getParticipants,
  });
  const mutation = useMutation({
    mutationFn: reportingApi.importWorkbook,
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.participants });
    },
  });

  const data = query.data;

  return {
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : query.error ? new Error("Failed to load participants") : null,
    imported: Boolean(data?.imported),
    importing: mutation.isPending,
    records: data?.records ?? [],
    metrics: [
      { value: data?.metrics.records ?? 0, label: "Participant records" },
      { value: data?.metrics.trainingComplete ?? 0, label: "Training complete" },
      { value: data?.metrics.placements ?? 0, label: "Job placements" },
      { value: data?.metrics.missingData ?? 0, label: "Missing data" },
    ],
    runImport() {
      if (data?.imported || mutation.isPending) return;
      mutation.mutate();
    },
  };
}
