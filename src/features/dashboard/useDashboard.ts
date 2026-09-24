import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { useAppSelector } from "@/app/hooks";
import { NETWORK_COUNTS } from "@/constants/organizations";
import { getPeriodById, getPeriodDueIso, getCurrentBaselineName, getPreviousBaselineName } from "@/constants/periods";
import {
  asOfDateForPeriod,
  formatCompletedDate,
  formatLastNotified,
  formatTimelineStatus,
} from "@/lib/reportingDates";
import { SUBMISSION_STATUSES, type ActivityEvent, type ImpactMetric, type ImpactMetricId, type SubmissionStatus } from "@/types/domain";

export type DashboardImpactCard = {
  id: ImpactMetricId;
  label: string;
  badge: string;
  before: string;
  after: string;
  leftCaption: string;
  rightCaption: string;
  footnote: string;
  trend: "up" | "down" | null;
};

function metricNumber(value: string): number {
  const match = value.replace(/,/g, "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : Number.NaN;
}

function trendFor(card: ImpactMetric): DashboardImpactCard["trend"] {
  const before = metricNumber(card.before);
  const after = metricNumber(card.after);
  if (!Number.isFinite(before) || !Number.isFinite(after) || before === after) return null;
  const improved = card.id === "median-time" ? after < before : after > before;
  return improved ? "up" : "down";
}

function footnoteFor(card: ImpactMetric): string {
  if (card.id === "median-time") return "days relative to due date, verified submissions";
  return "15 of 24 verified submissions with no chase email";
}

export type DashboardRow = {
  id: number;
  name: string;
  backbone: string | null;
  category: "Training provider";
  submissionStatus: SubmissionStatus;
  completedDate: string;
  timelineStatus: string;
  lastNotified: string;
};

export type StatusFilter = "all" | SubmissionStatus;

export type StatusFilterOption = {
  id: StatusFilter;
  label: string;
  count: number;
};

export type DashboardSummary = {
  isLoading: boolean;
  error: Error | null;
  pageSubtitle: string;
  panelTitle: string;
  panelSubtitle: string;
  stats: Array<{ label: string; value: string; note: string; tone?: "warn" | "bad" | "" }>;
  impact: DashboardImpactCard[];
  rows: DashboardRow[];
  statusFilters: StatusFilterOption[];
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  priority: ActivityEvent[];
  openProvider: (id: number) => void;
  openReview: () => void;
  openIntake: () => void;
};

export function useDashboard(): DashboardSummary {
  const navigate = useNavigate();
  const periodId = useAppSelector((state) => state.workspace.selectedPeriodId);
  const period = getPeriodById(periodId);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const query = useQuery({
    queryKey: queryKeys.dashboard(periodId),
    queryFn: () => reportingApi.getDashboard(periodId),
    placeholderData: keepPreviousData,
  });

  const data = query.data;
  const organizationCount = data?.stats.organizationCount ?? NETWORK_COUNTS.total;
  const dueOn = getPeriodDueIso(period);
  const asOf = asOfDateForPeriod(dueOn);
  const leftCaption = `${getPreviousBaselineName(period)} baseline`;
  const rightCaption = `${getCurrentBaselineName(period)} updating baseline`;

  const rows = useMemo(
    () =>
      (data?.providers ?? []).map((provider) => ({
        id: provider.id,
        name: provider.name,
        backbone: provider.backbone,
        category: "Training provider" as const,
        submissionStatus: provider.submissionStatus,
        completedDate: formatCompletedDate(
          provider.submissionStatus === "Complete" ? provider.completedOn : null,
        ),
        timelineStatus: formatTimelineStatus(
          provider.submissionStatus === "Complete" ? provider.completedOn : null,
          provider.dueOn,
          asOf,
        ),
        lastNotified: formatLastNotified(provider.statusChangedOn, provider.submissionStatus),
      })),
    [asOf, data?.providers],
  );

  const statusFilters = useMemo<StatusFilterOption[]>(() => {
    const counts = new Map<SubmissionStatus, number>();
    for (const status of SUBMISSION_STATUSES) counts.set(status, 0);
    for (const row of rows) counts.set(row.submissionStatus, (counts.get(row.submissionStatus) ?? 0) + 1);
    return [
      { id: "all", label: "All", count: rows.length },
      ...SUBMISSION_STATUSES.map((status) => ({
        id: status,
        label: status,
        count: counts.get(status) ?? 0,
      })),
    ];
  }, [rows]);

  const visibleRows = statusFilter === "all" ? rows : rows.filter((row) => row.submissionStatus === statusFilter);

  return {
    isLoading: query.isLoading && !data,
    error: query.error instanceof Error ? query.error : query.error ? new Error("Failed to load dashboard") : null,
    pageSubtitle:
      data?.pageSubtitle ??
      (period.kind === "quarterly"
        ? "A clear view of this quarter’s reporting readiness."
        : "A clear view of this month’s reporting readiness."),
    panelTitle: data?.panelTitle ?? "Submission status",
    panelSubtitle: data?.panelSubtitle ?? period.windowLabel,
    stats: [
      {
        label: "Reporting organizations",
        value: String(data?.stats.organizationCount ?? "—"),
        note: `${NETWORK_COUNTS.trainingProviders} training providers · ${NETWORK_COUNTS.backbone} backbone · ${NETWORK_COUNTS.employmentLiaisons} employment liaisons`,
      },
      {
        label: period.kind === "quarterly" ? "Complete for the quarter" : "Complete submissions",
        value: data ? `${data.stats.completeSubmissions}/${organizationCount}` : "—",
        note: data?.completeNote ?? "—",
      },
      {
        label: "Needs follow-up",
        value: String(data?.stats.needsFollowUp ?? "—"),
        note: data?.followUpNote ?? "—",
        tone: "warn",
      },
      {
        label: "Open review flags",
        value: String(data?.stats.openFlags ?? "—"),
        note: "Human review required",
        tone: "bad",
      },
    ],
    impact: (data?.impact ?? []).map((card) => ({
      ...card,
      leftCaption,
      rightCaption,
      footnote: footnoteFor(card),
      trend: trendFor(card),
    })),
    rows: visibleRows,
    statusFilters,
    statusFilter,
    setStatusFilter,
    priority: data?.priority ?? [],
    openProvider: (id) => navigate(`/providers/${id}`),
    openReview: () => navigate("/review"),
    openIntake: () => navigate("/intake"),
  };
}
