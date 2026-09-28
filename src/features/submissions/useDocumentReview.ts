import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import { MONTH_NAMES, getPeriodById } from "@/constants/periods";
import { resolveProviderId } from "@/lib/providerScope";
import { fieldsForForm, formLabel } from "@/lib/reviewModel";
import { getPeriodSubmission } from "@/store/submissionsSlice";
import type { ReviewFormId } from "@/types/submissions";

export function useDocumentReview(kind: Exclude<ReviewFormId, "eda-survey">) {
  const { periodId = "" } = useParams();
  const navigate = useNavigate();
  const identity = useAppSelector((state) => state.auth.identity);
  const providerId = resolveProviderId(identity);
  const record = useAppSelector((state) => getPeriodSubmission(state.submissions, periodId, providerId));
  const review = record.review[kind];
  const period = getPeriodById(periodId);

  return {
    periodId,
    monthLabel: period.windowLabel,
    organizationName: identity?.organizationName ?? "Training provider",
    label: formLabel(kind),
    fields: fieldsForForm(kind, record, {
      month: MONTH_NAMES[(period.month ?? 9) - 1],
      providerName: record.eda.trainingProvider || identity?.organizationName || "Training provider",
    }),
    showMarks: review.score === "Flagged",
    fieldMarks: review.fieldMarks,
    goBack() {
      navigate("/submissions");
    },
  };
}
