import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { EDA_SEGMENTS, type EdaSegmentId } from "@/constants/eda";
import { getPeriodById } from "@/constants/periods";
import { edaFillState, filledPrograms } from "@/lib/submissionDocuments";
import { getPeriodSubmission, setEdaMaxStep } from "@/store/submissionsSlice";
import { showToast } from "@/store/uiSlice";

export type EdaReviewSection = {
  id: EdaSegmentId;
  title: string;
  rows: Array<{ label: string; value: string }>;
};

export type EdaReviewSummary = {
  periodId: string;
  monthLabel: string;
  organizationName: string;
  sections: EdaReviewSection[];
  canSubmit: boolean;
  goBack: () => void;
  editSection: (id: EdaSegmentId) => void;
  submit: () => void;
};

function display(value: string): string {
  return value.trim() || "—";
}

export function useEdaReview(): EdaReviewSummary {
  const { periodId = "" } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const identity = useAppSelector((state) => state.auth.identity);
  const record = useAppSelector((state) => getPeriodSubmission(state.submissions, periodId));
  const period = getPeriodById(periodId);
  const draft = record.eda;

  const sections: EdaReviewSection[] = EDA_SEGMENTS.map((segment) => ({
    id: segment.id,
    title: segment.title,
    rows: [
      ...segment.fields.map((field) => ({ label: field.label, value: display(draft[field.key]) })),
      ...(segment.id === "training-provider"
        ? [
            {
              label: "Training programs",
              value: filledPrograms(draft.trainingPrograms).join(" · ") || "—",
            },
          ]
        : []),
    ],
  }));

  return {
    periodId,
    monthLabel: period.windowLabel,
    organizationName: identity?.organizationName ?? "Training provider",
    sections,
    canSubmit: edaFillState(draft) === "filled",
    goBack() {
      navigate("/submissions");
    },
    editSection(id) {
      dispatch(setEdaMaxStep({ periodId, step: EDA_SEGMENTS.findIndex((item) => item.id === id) }));
      navigate(`/submissions/${periodId}/eda/${id}`);
    },
    submit() {
      if (edaFillState(draft) !== "filled") return;
      dispatch(showToast("EDA Survey submitted."));
      navigate("/submissions");
    },
  };
}
