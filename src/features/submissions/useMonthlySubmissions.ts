import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { DEFAULT_PERIOD_ID, getElapsedQuarterMonths, getPeriodById, getPeriodDueDate } from "@/constants/periods";
import { canSubmitMonthlyPackage, documentList } from "@/lib/submissionDocuments";
import { getPeriodSubmission, submitMonthlyPackage } from "@/store/submissionsSlice";
import { showToast } from "@/store/uiSlice";
import type { DocumentFillState, MonthlyPackageStatus, SubmissionDocumentKind } from "@/types/submissions";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

export type SubmissionRow = {
  periodId: string;
  title: string;
  dueLabel: string;
  status: MonthlyPackageStatus;
  documents: Array<{ kind: SubmissionDocumentKind; label: string; state: DocumentFillState }>;
  canSubmit: boolean;
};

export type MonthlySubmissionsSummary = {
  organizationName: string;
  quarterLabel: string;
  rows: SubmissionRow[];
  expandedId: string | null;
  toggle: (periodId: string) => void;
  editDocument: (periodId: string, kind: SubmissionDocumentKind) => void;
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

  const rows = useMemo(
    () =>
      elapsed.map((item) => {
        const record = getPeriodSubmission(submissions, item.periodId);
        return {
          periodId: item.periodId,
          title: `${item.name} Monthly Submission`,
          dueLabel: dueLabel(item.year, item.month),
          status: record.status,
          documents: documentList(record),
          canSubmit: canSubmitMonthlyPackage(record) && record.status === "Action Needed",
        };
      }),
    [elapsed, submissions],
  );

  return {
    organizationName: identity?.organizationName ?? "Training provider",
    quarterLabel: `Q${Math.floor((month - 1) / 3) + 1} ${year}`,
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
    submitPackage(periodId) {
      const record = getPeriodSubmission(submissions, periodId);
      if (!canSubmitMonthlyPackage(record) || record.status !== "Action Needed") return;
      dispatch(submitMonthlyPackage({ periodId }));
      const row = rows.find((item) => item.periodId === periodId);
      dispatch(showToast(`${row?.title ?? "Monthly submission"} submitted.`));
    },
  };
}
