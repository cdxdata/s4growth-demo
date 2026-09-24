import { useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { getPeriodById } from "@/constants/periods";
import { edaReviewSections, type EdaReviewSection } from "@/lib/edaReviewSections";
import { notifyStatusChange } from "@/lib/notifyStatus";
import { REVIEW_FORMS, REVIEW_UNIT_TOTAL, fieldsForForm, formLabel, normalizeEdaReview, reviewSignature, scoredFormCount, statusAfterDone, statusAfterSaveLater } from "@/lib/reviewModel";
import {
  getPeriodSubmission,
  getProviderPeriodStatus,
  setEdaSectionScore,
  setFieldMark,
  setFormScore,
  setReviewPublished,
} from "@/store/submissionsSlice";
import { showToast } from "@/store/uiSlice";
import type { EdaSegmentId } from "@/constants/eda";
import type { FieldMark, FormReviewState, FormScore, ReviewField, ReviewFormId } from "@/types/submissions";

export type ProviderMonthlyForm = {
  id: ReviewFormId;
  label: string;
  score: FormScore | null;
  fields: ReviewField[];
  sections: EdaReviewSection[];
  sectionReviews: Record<string, FormReviewState>;
  fieldMarks: Record<string, FieldMark>;
};

export function useProviderMonthly() {
  const { id } = useParams();
  const providerId = Number(id ?? 1);
  const dispatch = useAppDispatch();
  const periodId = useAppSelector((state) => state.workspace.selectedPeriodId);
  const period = getPeriodById(periodId);
  const record = useAppSelector((state) => getPeriodSubmission(state.submissions, periodId, providerId));
  const storedStatus = useAppSelector((state) => getProviderPeriodStatus(state.submissions, periodId, providerId));
  const mail = useAppSelector((state) =>
    state.submissions.mail.find((item) => item.providerId === providerId && item.periodId === periodId),
  );

  const edaReview = normalizeEdaReview(record.review["eda-survey"]);
  const forms: ProviderMonthlyForm[] = REVIEW_FORMS.map((formId) => ({
    id: formId,
    label: formLabel(formId),
    score: formId === "eda-survey" ? edaReview.score : record.review[formId].score,
    fields: fieldsForForm(formId, record),
    sections: formId === "eda-survey" ? edaReviewSections(record.eda) : [],
    sectionReviews: formId === "eda-survey" ? edaReview.sections : {},
    fieldMarks: formId === "eda-survey" ? edaReview.fieldMarks : record.review[formId].fieldMarks,
  }));

  const scored = scoredFormCount(record.review);
  const signature = reviewSignature(record.review);
  const canFinish = scored === REVIEW_UNIT_TOTAL && signature !== (record.reviewPublished ?? "");

  return {
    periodId,
    monthLabel: period.windowLabel,
    storedStatus: storedStatus?.status ?? null,
    forms,
    scored,
    total: REVIEW_UNIT_TOTAL,
    canFinish,
    lastMail: mail ?? null,
    setScore(formId: ReviewFormId, score: FormScore) {
      if (formId === "eda-survey") return;
      dispatch(setFormScore({ providerId, periodId, formId, score: record.review[formId].score === score ? null : score }));
    },
    setEdaScore(sectionId: EdaSegmentId, score: FormScore) {
      const current = edaReview.sections[sectionId]?.score ?? null;
      dispatch(setEdaSectionScore({ providerId, periodId, sectionId, score: current === score ? null : score }));
    },
    setMark(formId: ReviewFormId, fieldId: string, mark: FieldMark) {
      const current = record.review[formId].fieldMarks[fieldId];
      dispatch(setFieldMark({ providerId, periodId, formId, fieldId, mark: current === mark ? null : mark }));
    },
    saveLater() {
      const next = statusAfterSaveLater(record.review);
      if (next) {
        notifyStatusChange(dispatch, {
          providerId,
          periodId,
          status: next,
          record,
          previous: storedStatus?.status ?? null,
        });
      }
      dispatch(showToast("Review progress saved."));
    },
    finish() {
      const next = statusAfterDone(record.review);
      if (!next) {
        dispatch(showToast("Score every form before marking the review done."));
        return;
      }
      notifyStatusChange(dispatch, {
        providerId,
        periodId,
        status: next,
        record,
        previous: storedStatus?.status ?? null,
        force: true,
      });
      dispatch(setReviewPublished({ providerId, periodId, signature }));
      dispatch(showToast(next === "Complete" ? "Review complete." : "Flagged items sent back to the training provider."));
    },
  };
}
