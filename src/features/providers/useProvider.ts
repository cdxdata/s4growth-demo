import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import type { ActivityEvent, ChecklistItem, Contact, Provider } from "@/types/domain";

export type ProviderSummary = {
  isLoading: boolean;
  error: Error | null;
  provider: Provider | null;
  checklist: ChecklistItem[];
  contacts: Contact[];
  activity: ActivityEvent[];
  openGaps: number;
  completed: boolean;
  canCompleteIntake: boolean;
  checklistSubtitle: string;
  goBack: () => void;
  openIntake: () => void;
  openParticipants: () => void;
  openReview: () => void;
  openNudges: () => void;
};

export function useProvider(): ProviderSummary {
  const { id } = useParams();
  const providerId = Number(id ?? 1);
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: queryKeys.provider(providerId),
    queryFn: () => reportingApi.getProvider(providerId),
    enabled: Number.isFinite(providerId),
  });

  const detail = query.data;
  const completed = detail?.provider.submissionStatus === "Complete";

  return {
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : query.error ? new Error("Failed to load subawardee") : null,
    provider: detail?.provider ?? null,
    checklist: detail?.checklist ?? [],
    contacts: detail?.contacts ?? [],
    activity: detail?.activity ?? [],
    openGaps: detail?.openGaps ?? 0,
    completed,
    canCompleteIntake: detail?.provider.id === 1 && !completed,
    checklistSubtitle: completed
      ? "All required information has been submitted."
      : detail?.provider.id === 1
        ? "Two items need attention before the monthly file is complete."
        : detail
          ? `${detail.provider.submissionStatus} for this reporting cycle.`
          : "Monthly reporting items for this organization.",
    goBack: () => navigate("/"),
    openIntake: () => navigate("/intake"),
    openParticipants: () => navigate("/participants"),
    openReview: () => navigate("/review"),
    openNudges: () => navigate("/nudges"),
  };
}
