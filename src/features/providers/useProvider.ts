import { useQuery } from "@tanstack/react-query";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { useAppSelector } from "@/app/hooks";
import { MONTH_NAMES, getPeriodById } from "@/constants/periods";
import { overviewDocuments, type OverviewDocument } from "@/lib/overviewDocuments";
import { getPeriodSubmission, getProviderPeriodStatus } from "@/store/submissionsSlice";
import type { Representative } from "@/types/auth";
import type { ActivityEvent, Provider } from "@/types/domain";

export type ProviderTab = "overview" | "monthly";

export type ProviderSummary = {
  isLoading: boolean;
  error: Error | null;
  providerId: number;
  provider: Provider | null;
  tab: ProviderTab;
  documents: OverviewDocument[];
  representatives: Representative[];
  activity: ActivityEvent[];
  openGaps: number;
  completed: boolean;
  canCompleteIntake: boolean;
  checklistTitle: string;
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
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: ProviderTab = searchParams.get("tab") === "monthly" ? "monthly" : "overview";
  const query = useQuery({
    queryKey: queryKeys.provider(providerId),
    queryFn: () => reportingApi.getProvider(providerId),
    enabled: Number.isFinite(providerId),
  });
  const repsQuery = useQuery({
    queryKey: queryKeys.providerRepresentatives(providerId),
    queryFn: () => reportingApi.getProviderRepresentatives(providerId),
    enabled: Number.isFinite(providerId),
  });

  const periodId = useAppSelector((state) => state.workspace.selectedPeriodId);
  const period = getPeriodById(periodId);
  const record = useAppSelector((state) => getPeriodSubmission(state.submissions, periodId, providerId));
  const storedStatus = useAppSelector((state) => getProviderPeriodStatus(state.submissions, periodId, providerId));
  const detail = query.data?.provider.id === providerId ? query.data : undefined;
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
    isLoading: (query.isLoading || repsQuery.isLoading) && !detail,
    error: query.error instanceof Error ? query.error : query.error ? new Error("Failed to load subawardee") : null,
    providerId,
    provider,
    tab,
    documents: overviewDocuments(record, provider?.submissionStatus ?? "Not started"),
    representatives: repsQuery.data ?? [],
    activity: detail?.activity ?? [],
    openGaps: detail?.openGaps ?? 0,
    completed,
    canCompleteIntake: detail?.provider.id === 1 && !completed,
    checklistTitle: `${MONTH_NAMES[(period.month ?? 9) - 1]} reporting checklist`,
    checklistSubtitle: completed
      ? "All required documents have been submitted."
      : "Documents in this month’s reporting packet.",
    goBack: () => navigate("/"),
    openTab(next) {
      if (next === "monthly") {
        setSearchParams({ tab: "monthly" }, { replace: true });
        return;
      }
      setSearchParams({}, { replace: true });
    },
    openIntake: () => setSearchParams({ tab: "monthly" }, { replace: true }),
    openParticipants: () => navigate("/participants"),
    openReview: () => navigate("/review"),
    openNudges: () => navigate("/nudges"),
  };
}
