import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { useAppSelector } from "@/app/hooks";
import { getProviderPeriodStatus } from "@/store/submissionsSlice";
import type { ActivityEvent, ChecklistItem, Contact, Provider } from "@/types/domain";

export type ProviderTab = "overview" | "monthly";

export type ProviderSummary = {
  isLoading: boolean;
  error: Error | null;
  provider: Provider | null;
  tab: ProviderTab;
  checklist: ChecklistItem[];
  contacts: Contact[];
  activity: ActivityEvent[];
  openGaps: number;
  completed: boolean;
  canCompleteIntake: boolean;
  checklistSubtitle: string;
  goBack: () => void;
  openTab: (tab: ProviderTab) => void;
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

  const [tab, setTab] = useState<ProviderTab>("overview");
  const periodId = useAppSelector((state) => state.workspace.selectedPeriodId);
  const storedStatus = useAppSelector((state) => getProviderPeriodStatus(state.submissions, periodId, providerId));
  const detail = query.data;
  const provider = detail?.provider
    ? {
        ...detail.provider,
        submissionStatus: storedStatus?.status ?? detail.provider.submissionStatus,
        completedOn: storedStatus?.completedOn ?? detail.provider.completedOn,
        statusChangedOn: storedStatus?.statusChangedOn ?? detail.provider.statusChangedOn,
      }
    : null;
  const completed = provider?.submissionStatus === "Complete";

  return {
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : query.error ? new Error("Failed to load subawardee") : null,
    provider,
    tab,
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
    openTab: setTab,
    openIntake: () => setTab("monthly"),
    openParticipants: () => navigate("/participants"),
    openReview: () => navigate("/review"),
    openNudges: () => navigate("/nudges"),
  };
}
