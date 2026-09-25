import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { providersForPeriod } from "@/api/dashboardByPeriod";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { DEFAULT_PERIOD_ID, getElapsedQuarterMonths, getPeriodById, getPeriodDueDate } from "@/constants/periods";
import { notifyStatusChange } from "@/lib/notifyStatus";
import { resolveProviderId } from "@/lib/providerScope";
import { normalizeEdaReview } from "@/lib/reviewModel";
import { canSubmitMonthlyPackage, documentList } from "@/lib/submissionDocuments";
import { getPeriodSubmission, getProviderPeriodStatus, submitMonthlyPackage } from "@/store/submissionsSlice";
import { showToast } from "@/store/uiSlice";
import type { SubmissionStatus } from "@/types/domain";
import type { DocumentFillState, MonthlyPackageStatus, PeriodSubmissionRecord, SubmissionDocumentKind } from "@/types/submissions";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export type SubmissionRow = {
  periodId: string;
  title: string;
  dueLabel: string;
  status: MonthlyPackageStatus;
  reviewStatus: SubmissionStatus | null;
  documents: Array<{ kind: SubmissionDocumentKind; label: string; state: DocumentFillState; flagged: boolean }>;
  canSubmit: boolean;
};

function documentIsFlagged(record: PeriodSubmissionRecord, kind: SubmissionDocumentKind): boolean {
  if (kind === "eda-survey") return normalizeEdaReview(record.review["eda-survey"]).score === "Flagged";
  if (kind === "technical-report") return record.review["technical-report"].score === "Flagged";
  return record.review.invoice.score === "Flagged";
}

export type MonthlySubmissionsSummary = {
  organizationName: string;
  rows: SubmissionRow[];
  expandedId: string | null;
  toggle: (periodId: string) => void;
  editDocument: (periodId: string, kind: SubmissionDocumentKind) => void;
  reviewDocument: (periodId: string, kind: SubmissionDocumentKind) => void;
  submitPackage: (periodId: string) => void;
};

function dueLabel(year: number, month: number): string {
  const due = getPeriodDueDate({
    id: `${year}-${String(month).padStart(2, "0")}`,
    kind: "monthly",
    year,
    month,
    label: "",
    windowLabel: "",
  });
  return `Due ${MONTH_SHORT[due.getMonth()]} ${due.getDate()}`;
}

function providerStatusForPeriod(
  periodId: string,
  organizationName: string,
  stored?: SubmissionStatus | null,
): SubmissionStatus {
  if (stored) return stored;
  return providersForPeriod(periodId).find((item) => item.name === organizationName)?.submissionStatus ?? "Not started";
}

export function cardStatuses(
  packageStatus: MonthlyPackageStatus,
  submissionStatus: SubmissionStatus,
): { status: MonthlyPackageStatus; reviewStatus: SubmissionStatus | null } {
  if (submissionStatus === "Missing/flagged") {
    return { status: "Action Needed", reviewStatus: "Missing/flagged" };
  }
  if (submissionStatus === "Complete") {
    return { status: "Approved", reviewStatus: null };
  }
  if (packageStatus === "Submitted") {
    return { status: "Submitted", reviewStatus: submissionStatus };
  }
  return { status: packageStatus, reviewStatus: null };
}

export function useMonthlySubmissions(): MonthlySubmissionsSummary {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const identity = useAppSelector((state) => state.auth.identity);
  const submissions = useAppSelector((state) => state.submissions);
  const current = getPeriodById(DEFAULT_PERIOD_ID);
  const year = current.year;
  const month = current.month ?? 9;
  const elapsed = getElapsedQuarterMonths(year, month);
  const [expandedId, setExpandedId] = useState<string | null>(elapsed[0]?.periodId ?? null);
  const organizationName = identity?.organizationName ?? "Training provider";
  const providerId = resolveProviderId(identity);

  const rows = useMemo(
    () =>
      elapsed.map((item) => {
        const record = getPeriodSubmission(submissions, item.periodId, providerId);
        const stored = getProviderPeriodStatus(submissions, item.periodId, providerId)?.status ?? null;
        const display = cardStatuses(record.status, providerStatusForPeriod(item.periodId, organizationName, stored));
        return {
          periodId: item.periodId,
          title: `${item.name} Monthly Submission`,
          dueLabel: dueLabel(item.year, item.month),
          status: display.status,
          reviewStatus: display.reviewStatus,
          documents: documentList(record).map((document) => ({
            ...document,
            flagged: documentIsFlagged(record, document.kind),
          })),
          canSubmit: canSubmitMonthlyPackage(record) && record.status === "Action Needed",
        };
      }),
    [elapsed, organizationName, providerId, submissions],
  );

  return {
    organizationName,
    rows,
    expandedId,
    toggle(periodId) {
      setExpandedId((currentId) => (currentId === periodId ? null : periodId));
    },
    editDocument(periodId, kind) {
      if (kind === "technical-report") navigate(`/submissions/${periodId}/technical-report`);
      if (kind === "eda-survey") navigate(`/submissions/${periodId}/eda/training-provider`);
      if (kind === "invoice") navigate(`/submissions/${periodId}/invoice`);
    },
    reviewDocument(periodId, kind) {
      if (kind === "technical-report") navigate(`/submissions/${periodId}/technical-report/review`);
      if (kind === "eda-survey") navigate(`/submissions/${periodId}/eda/review`);
      if (kind === "invoice") navigate(`/submissions/${periodId}/invoice/review`);
    },
    submitPackage(periodId) {
      const record = getPeriodSubmission(submissions, periodId, providerId);
      if (!canSubmitMonthlyPackage(record) || record.status !== "Action Needed") return;
      dispatch(submitMonthlyPackage({ providerId, periodId }));
      const previous = getProviderPeriodStatus(submissions, periodId, providerId)?.status ?? null;
      if (previous === "Missing/flagged" || previous === "Not started") {
        notifyStatusChange(dispatch, {
          providerId,
          periodId,
          status: "Awaiting review",
          record,
          previous,
          source: "training-provider",
        });
      }
      const row = rows.find((item) => item.periodId === periodId);
      dispatch(showToast(`${row?.title ?? "Monthly submission"} submitted.`));
    },
  };
}
