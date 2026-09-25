import { useEffect, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { getPeriodById } from "@/constants/periods";
import { edaReviewSections, type EdaReviewSection } from "@/lib/edaReviewSections";
import { notifyStatusChange } from "@/lib/notifyStatus";
import { MONTH_NAMES } from "@/constants/periods";
import { providerNameById } from "@/lib/providerScope";
import { REVIEW_FORMS, REVIEW_UNIT_TOTAL, changedReviewFieldIds, fieldsForForm, formLabel, normalizeEdaReview, reviewSignature, scoredFormCount, statusAfterDone, statusAfterSaveLater } from "@/lib/reviewModel";
import {
  captureReviewSnapshot,
  getPeriodSubmission,
  getProviderPeriodStatus,
  reconcileReviewChanges,
  restoreReview,
  setEdaSectionScore,
  setFieldMark,
  setFormScore,
  setReviewPublished,
} from "@/store/submissionsSlice";
import { showToast } from "@/store/uiSlice";
import type { EdaSegmentId } from "@/constants/eda";
import type { FieldMark, FormReviewState, FormScore, PackageReview, ReviewField, ReviewFormId } from "@/types/submissions";

export type ProviderMonthlyForm = {
  id: ReviewFormId;
  label: string;
  score: FormScore | null;
  fields: ReviewField[];
  sections: EdaReviewSection[];
  sectionReviews: Record<string, FormReviewState>;
  fieldMarks: Record<string, FieldMark>;
};

function cloneReview(review: PackageReview): PackageReview {
  return structuredClone(review);
}

export function useProviderMonthly() {
  const { id } = useParams();
  const providerId = Number(id ?? 1);
  const dispatch = useAppDispatch();
  const [, setSearchParams] = useSearchParams();
  const periodId = useAppSelector((state) => state.workspace.selectedPeriodId);
  const period = getPeriodById(periodId);
  const record = useAppSelector((state) => getPeriodSubmission(state.submissions, periodId, providerId));
  const storedStatus = useAppSelector((state) => getProviderPeriodStatus(state.submissions, periodId, providerId));
  const mail = useAppSelector((state) =>
    state.submissions.mail.find((item) => item.providerId === providerId && item.periodId === periodId),
  );

  const edaReview = normalizeEdaReview(record.review["eda-survey"]);
  const reviewContext = {
    month: MONTH_NAMES[(period.month ?? 9) - 1],
    providerName: record.eda.trainingProvider || providerNameById(providerId),
  };
  const forms: ProviderMonthlyForm[] = REVIEW_FORMS.map((formId) => ({
    id: formId,
    label: formLabel(formId),
    score: formId === "eda-survey" ? edaReview.score : record.review[formId].score,
    fields: fieldsForForm(formId, record, reviewContext),
    sections: formId === "eda-survey" ? edaReviewSections(record.eda) : [],
    sectionReviews: formId === "eda-survey" ? edaReview.sections : {},
    fieldMarks: formId === "eda-survey" ? edaReview.fieldMarks : record.review[formId].fieldMarks,
  }));

  const scored = scoredFormCount(record.review);
  const signature = reviewSignature(record.review);
  const canFinish = scored === REVIEW_UNIT_TOTAL && signature !== (record.reviewPublished ?? "");
  const changedFieldIds = changedReviewFieldIds(record);

  const changedKey = changedFieldIds.join("|");
  const reviewBaseline = useRef(cloneReview(record.review));
  useEffect(() => {
    reviewBaseline.current = cloneReview(record.review);
  }, [periodId, providerId]);

  useEffect(() => {
    if (!changedKey) return;
    dispatch(reconcileReviewChanges({ providerId, periodId }));
  }, [changedKey, dispatch, periodId, providerId]);

  return {
    periodId,
    monthLabel: period.windowLabel,
    storedStatus: storedStatus?.status ?? null,
    forms,
    changedFieldIds,
    scored,
    total: REVIEW_UNIT_TOTAL,
    allMarked: scored === REVIEW_UNIT_TOTAL,
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
    goBack() {
      dispatch(restoreReview({ providerId, periodId, review: reviewBaseline.current }));
      setSearchParams({}, { replace: true });
    },
    saveLater() {
      dispatch(captureReviewSnapshot({ providerId, periodId }));
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
      reviewBaseline.current = cloneReview(record.review);
      dispatch(showToast("Review progress saved."));
    },
    finish() {
      const next = statusAfterDone(record.review);
      if (!next) {
        dispatch(showToast("Score every form before marking the review done."));
        return;
      }
      dispatch(captureReviewSnapshot({ providerId, periodId }));
      notifyStatusChange(dispatch, {
        providerId,
        periodId,
        status: next,
        record,
        previous: storedStatus?.status ?? null,
        force: true,
      });
      dispatch(setReviewPublished({ providerId, periodId, signature }));
      reviewBaseline.current = cloneReview(record.review);
      dispatch(showToast(next === "Complete" ? "Review complete." : "Flagged items sent back to the training provider."));
    },
  };
}
