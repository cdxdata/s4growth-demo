import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import type { NudgeFollowUp, NudgeLog, NudgeMessage } from "@/types/domain";

export type NudgesSummary = {
  isLoading: boolean;
  error: Error | null;
  overdueCount: number;
  followUp: NudgeFollowUp[];
  message: NudgeMessage | null;
  sent: NudgeLog | null;
  sending: boolean;
  sendReminder: () => void;
};

export function useNudges(): NudgesSummary {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.nudges,
    queryFn: reportingApi.getNudges,
  });
  const mutation = useMutation({
    mutationFn: reportingApi.sendNudge,
    async onSuccess() {
      await queryClient.invalidateQueries({ queryKey: queryKeys.nudges });
    },
  });

  return {
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : query.error ? new Error("Failed to load nudges") : null,
    overdueCount: query.data?.overdueCount ?? 0,
    followUp: query.data?.followUp ?? [],
    message: query.data?.message ?? null,
    sent: query.data?.sent ?? null,
    sending: mutation.isPending,
    sendReminder() {
      if (query.data?.sent) return;
      mutation.mutate();
    },
  };
}
