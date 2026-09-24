import { useQuery } from "@tanstack/react-query";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { useAppSelector } from "@/app/hooks";

export type LiaisonHomeSummary = {
  isLoading: boolean;
  error: Error | null;
  name: string;
  participantsEmployed: number;
};

export function useLiaisonHome(): LiaisonHomeSummary {
  const entityId = useAppSelector((state) => state.auth.identity?.entityId ?? "");
  const query = useQuery({
    queryKey: queryKeys.liaisonHome(entityId),
    queryFn: () => reportingApi.getLiaisonHome(entityId),
    enabled: Boolean(entityId),
  });

  return {
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : query.error ? new Error("Failed to load workspace") : null,
    name: query.data?.name ?? "Employment liaison",
    participantsEmployed: query.data?.participantsEmployed ?? 0,
  };
}
