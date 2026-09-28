import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { providersForPeriod } from "@/api/dashboardByPeriod";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { useAppSelector } from "@/app/hooks";
import { NETWORK_COUNTS } from "@/constants/organizations";
import {
  getCurrentBaselineName,
  getPeriodById,
  getPeriodDueIso,
  getPreviousBaselineName,
  getPreviousPeriod,
} from "@/constants/periods";
import {
  asOfDateForPeriod,
  formatCompletedDate,
  formatDayCount,
  formatLastNotified,
  formatTimelineStatus,
  medianNumber,
  timelineStatusDays,
} from "@/lib/reportingDates";
import { SUBMISSION_STATUSES, type ActivityEvent, type ImpactMetric, type ImpactMetricId, type Provider, type SubmissionStatus } from "@/types/domain";
import type { ProviderPeriodStatus } from "@/types/submissions";

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

function medianChangeBadge(previousDays: number | null, currentDays: number): string {
  if (previousDays === null) return "—";
  const previous = Math.abs(Math.round(previousDays));
  const current = Math.abs(Math.round(currentDays));
  const delta = current - previous;
  if (delta === 0) return "No change";
  const label = Math.abs(delta) === 1 ? "1 day" : `${Math.abs(delta)} days`;
  return delta < 0 ? `${label} saved` : `${label} extra`;
}

function medianTimelineDays(
  providers: Array<Pick<Provider, "id" | "dueOn" | "submissionStatus" | "completedOn">>,
  stored: Record<string, ProviderPeriodStatus>,
  asOf: string,
): number | null {
  return medianNumber(
    providers.map((provider) => {
      const overlay = stored[String(provider.id)];
      const status = overlay?.status ?? provider.submissionStatus;
      const completedOn = status === "Complete" ? overlay?.completedOn ?? provider.completedOn : null;
      return timelineStatusDays(completedOn, provider.dueOn, asOf);
    }),
  );
}

function categorySubmittedLabel(category: DashboardRow["category"], count: number): string {
  if (category === "Training provider") {
    return count === 1 ? "Training Provider" : "Training Providers";
  }
  return count === 1 ? category : `${category}s`;
}

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

function completeCategoryNote(rows: DashboardRow[]): string {
  const complete = rows.filter((row) => row.submissionStatus === "Complete");
  if (!complete.length) return "No submissions complete";
  const counts = new Map<DashboardRow["category"], number>();
  for (const row of complete) {
    counts.set(row.category, (counts.get(row.category) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([category, count]) => `${count} ${categorySubmittedLabel(category, count)} submitted`)
    .join(" · ");
}

export type DashboardRow = {
  id: number;
  name: string;
  backbone: string | null;
  category: "Training provider";
  submissionStatus: SubmissionStatus;
  completedDate: string;
  timelineStatus: string;
  timelineDays: number;
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
  stats: Array<{
    label: string;
    value: string;
    note: string | string[];
    tone?: "warn" | "bad" | "";
    onClick?: () => void;
  }>;
  impact: DashboardImpactCard[];
  rows: DashboardRow[];
  statusFilters: StatusFilterOption[];
  statusFilter: StatusFilter;
  setStatusFilter: (filter: StatusFilter) => void;
  priority: ActivityEvent[];
  openProvider: (id: number) => void;
  openReview: () => void;
  openNudges: () => void;
  openIntake: () => void;
};

export function useDashboard(): DashboardSummary {
  const navigate = useNavigate();
  const periodId = useAppSelector((state) => state.workspace.selectedPeriodId);
  const storedStatuses = useAppSelector((state) => state.submissions.providerStatus[periodId] ?? {});
  const period = getPeriodById(periodId);
  const previousPeriod = getPreviousPeriod(period);
  const previousStored = useAppSelector((state) =>
    previousPeriod ? state.submissions.providerStatus[previousPeriod.id] ?? {} : {},
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const query = useQuery({
    queryKey: queryKeys.dashboard(periodId),
    queryFn: () => reportingApi.getDashboard(periodId),
    placeholderData: keepPreviousData,
  });

  const data = query.data;
  const dueOn = getPeriodDueIso(period);
  const asOf = asOfDateForPeriod(dueOn);
  const leftCaption = `${getPreviousBaselineName(period)} baseline`;
  const rightCaption = `${getCurrentBaselineName(period)} updating baseline`;

  const rows = useMemo(
    () =>
      (data?.providers ?? []).map((provider) => {
        const stored = storedStatuses[String(provider.id)];
        const submissionStatus = stored?.status ?? provider.submissionStatus;
        const completedOn = stored?.completedOn ?? provider.completedOn;
        const statusChangedOn = stored?.statusChangedOn ?? provider.statusChangedOn;
        const timelineCompletedOn = submissionStatus === "Complete" ? completedOn : null;
        return {
          id: provider.id,
          name: provider.name,
          backbone: provider.backbone,
          category: "Training provider" as const,
          submissionStatus,
          completedDate: formatCompletedDate(timelineCompletedOn),
          timelineStatus: formatTimelineStatus(timelineCompletedOn, provider.dueOn, asOf),
          timelineDays: timelineStatusDays(timelineCompletedOn, provider.dueOn, asOf),
          lastNotified: formatLastNotified(statusChangedOn, submissionStatus),
        };
      }),
    [asOf, data?.providers, storedStatuses],
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

  const derived = useMemo(() => {
    const subawardees = rows.filter((row) => row.category === "Training provider");
    const completeCount = subawardees.filter((row) => row.submissionStatus === "Complete").length;
    const awaitingReview = subawardees.filter((row) => row.submissionStatus === "Awaiting review");
    const inReview = subawardees.filter((row) => row.submissionStatus === "In review");
    const needAttention = [...awaitingReview, ...inReview];
    const missingFlagged = subawardees.filter((row) => row.submissionStatus === "Missing/flagged").length;
    const notStarted = subawardees.filter((row) => row.submissionStatus === "Not started").length;
    return {
      completeCount,
      totalCount: rows.length,
      needAttentionCount: needAttention.length,
      needAttentionNotes: [
        needAttention[0]?.timelineStatus ?? "No submissions need attention",
        countLabel(awaitingReview.length, "Awaiting Review", "Awaiting Reviews"),
        countLabel(inReview.length, "In review", "In review"),
      ],
      followUpCount: missingFlagged + notStarted,
      followUpNotes: [
        countLabel(missingFlagged, "Missing/flagged submission", "Missing/flagged submissions"),
        countLabel(notStarted, "Not started submission", "Not started submissions"),
      ],
      completeNote: completeCategoryNote(subawardees),
      medianDays: medianNumber(rows.map((row) => row.timelineDays)),
      previousMedianDays: previousPeriod
        ? medianTimelineDays(
            providersForPeriod(previousPeriod.id),
            previousStored,
            asOfDateForPeriod(getPeriodDueIso(previousPeriod)),
          )
        : null,
    };
  }, [previousPeriod, previousStored, rows]);

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
        value: data ? `${derived.completeCount}/${derived.totalCount}` : "—",
        note: data ? derived.completeNote : "—",
      },
      {
        label: "Needs attention",
        value: data ? String(derived.needAttentionCount) : "—",
        note: data ? derived.needAttentionNotes : "—",
        tone: "warn",
        onClick: () => navigate("/review"),
      },
      {
        label: "Needs follow-up",
        value: data ? String(derived.followUpCount) : "—",
        note: data ? derived.followUpNotes : "—",
        tone: "bad",
        onClick: () => navigate("/nudges"),
      },
    ],
    impact: (data?.impact ?? []).map((card) => {
      if (card.id !== "median-time" || derived.medianDays === null) {
        return {
          ...card,
          leftCaption,
          rightCaption,
          footnote: footnoteFor(card),
          trend: trendFor(card),
        };
      }

      const after = formatDayCount(derived.medianDays);
      const before = derived.previousMedianDays === null ? "—" : formatDayCount(derived.previousMedianDays);
      return {
        ...card,
        before,
        after,
        badge: medianChangeBadge(derived.previousMedianDays, derived.medianDays),
        leftCaption,
        rightCaption,
        footnote: footnoteFor(card),
        trend: trendFor({ ...card, before, after }),
      };
    }),
    rows: visibleRows,
    statusFilters,
    statusFilter,
    setStatusFilter,
    priority: data?.priority ?? [],
    openProvider: (id) => {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      navigate(`/providers/${id}?tab=monthly`);
    },
    openReview: () => navigate("/review"),
    openNudges: () => navigate("/nudges"),
    openIntake: () => navigate("/providers/1?tab=monthly"),
  };
}
