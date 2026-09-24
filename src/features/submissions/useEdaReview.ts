import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { EDA_SEGMENTS, type EdaSegmentId } from "@/constants/eda";
import { getPeriodById } from "@/constants/periods";
import { edaReviewSections } from "@/lib/edaReviewSections";
import { resolveProviderId } from "@/lib/providerScope";
import { normalizeEdaReview } from "@/lib/reviewModel";
import { getPeriodSubmission, setEdaMaxStep } from "@/store/submissionsSlice";
import type { FormReviewState } from "@/types/submissions";

export type EdaReviewSummary = {
  periodId: string;
  monthLabel: string;
  organizationName: string;
  sections: ReturnType<typeof edaReviewSections>;
  sectionReviews: Record<string, FormReviewState>;
  goBack: () => void;
  editSection: (id: EdaSegmentId) => void;
  done: () => void;
};

export function useEdaReview(): EdaReviewSummary {
  const { periodId = "" } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const identity = useAppSelector((state) => state.auth.identity);
  const providerId = resolveProviderId(identity);
  const record = useAppSelector((state) => getPeriodSubmission(state.submissions, periodId, providerId));
  const period = getPeriodById(periodId);
  const review = normalizeEdaReview(record.review["eda-survey"]);

  return {
    periodId,
    monthLabel: period.windowLabel,
    organizationName: identity?.organizationName ?? "Training provider",
    sections: edaReviewSections(record.eda),
    sectionReviews: review.sections,
    goBack() {
      navigate("/submissions");
    },
    editSection(id) {
      dispatch(setEdaMaxStep({ providerId, periodId, step: EDA_SEGMENTS.findIndex((item) => item.id === id) }));
      navigate(`/submissions/${periodId}/eda/${id}`);
    },
    done() {
      navigate("/submissions");
    },
  };
}
