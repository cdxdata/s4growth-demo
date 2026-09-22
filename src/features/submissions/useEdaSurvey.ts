import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { EDA_SEGMENTS, EDA_SEGMENT_IDS, isEdaSegmentId, type EdaFieldKey, type EdaSegmentId } from "@/constants/eda";
import { getPeriodById } from "@/constants/periods";
import { isEdaSegmentValid, isTrainingProviderSegmentValid } from "@/lib/submissionDocuments";
import { getPeriodSubmission, setEdaMaxStep, updateEda } from "@/store/submissionsSlice";
import { showToast } from "@/store/uiSlice";
import type { EdaSurveyDraft } from "@/types/submissions";

const MAX_PROGRAMS = 20;

export type EdaSurveySummary = {
  ready: boolean;
  redirectTo: string | null;
  periodId: string;
  monthLabel: string;
  organizationName: string;
  formTitle: string;
  segment: (typeof EDA_SEGMENTS)[number];
  segmentIndex: number;
  segments: Array<{
    id: EdaSegmentId;
    title: string;
    current: boolean;
    reachable: boolean;
  }>;
  draft: EdaSurveyDraft;
  programs: string[];
  error: string;
  showErrors: boolean;
  isLast: boolean;
  canAddProgram: boolean;
  goBack: () => void;
  goSegment: (id: EdaSegmentId) => void;
  change: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
  changeProgram: (index: number, value: string) => void;
  addProgram: () => void;
  removeProgram: (index: number) => void;
  saveSubmission: () => void;
  saveAndContinue: () => void;
};

export function useEdaSurvey(): EdaSurveySummary {
  const { periodId = "", segmentId = "" } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const identity = useAppSelector((state) => state.auth.identity);
  const record = useAppSelector((state) => getPeriodSubmission(state.submissions, periodId));
  const [error, setError] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const period = getPeriodById(periodId);
  const currentId = isEdaSegmentId(segmentId) ? segmentId : EDA_SEGMENT_IDS[0];
  const segmentIndex = Math.max(0, EDA_SEGMENT_IDS.indexOf(currentId));
  const reachableIndex = isTrainingProviderSegmentValid(record.eda) ? Math.max(record.edaMaxStep, 0) : 0;
  const programs = record.eda.trainingPrograms.length > 0 ? record.eda.trainingPrograms : [""];

  let redirectTo: string | null = null;
  if (!periodId || period.kind === "quarterly") redirectTo = "/submissions";
  else if (!isEdaSegmentId(segmentId)) redirectTo = `/submissions/${periodId}/eda/training-provider`;
  else if (segmentIndex > reachableIndex) redirectTo = `/submissions/${periodId}/eda/${EDA_SEGMENT_IDS[reachableIndex]}`;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentId]);

  useEffect(() => {
    if (!record.eda.trainingProvider && identity?.organizationName) {
      dispatch(updateEda({ periodId, patch: { trainingProvider: identity.organizationName } }));
    }
  }, [dispatch, identity?.organizationName, periodId, record.eda.trainingProvider]);

  return {
    ready: !redirectTo,
    redirectTo,
    periodId,
    monthLabel: period.windowLabel,
    organizationName: identity?.organizationName ?? "Training provider",
    formTitle: "EDA Survey",
    segment: EDA_SEGMENTS[segmentIndex] ?? EDA_SEGMENTS[0],
    segmentIndex,
    segments: EDA_SEGMENTS.map((item, index) => ({
      id: item.id,
      title: item.title,
      current: item.id === currentId,
      reachable: index <= reachableIndex,
    })),
    draft: record.eda,
    programs,
    error,
    showErrors,
    isLast: segmentIndex === EDA_SEGMENTS.length - 1,
    canAddProgram: programs.length < MAX_PROGRAMS,
    goBack() {
      navigate("/submissions");
    },
    goSegment(id) {
      const nextIndex = EDA_SEGMENT_IDS.indexOf(id);
      if (nextIndex <= reachableIndex) {
        navigate(`/submissions/${periodId}/eda/${id}`);
      }
    },
    change(event) {
      dispatch(updateEda({ periodId, patch: { [event.target.name as EdaFieldKey]: event.target.value } }));
    },
    changeProgram(index, value) {
      const next = [...programs];
      next[index] = value;
      dispatch(updateEda({ periodId, patch: { trainingPrograms: next } }));
    },
    addProgram() {
      if (programs.length >= MAX_PROGRAMS) return;
      dispatch(updateEda({ periodId, patch: { trainingPrograms: [...programs, ""] } }));
    },
    removeProgram(index) {
      if (programs.length <= 1) return;
      dispatch(updateEda({ periodId, patch: { trainingPrograms: programs.filter((_, item) => item !== index) } }));
    },
    saveSubmission() {
      dispatch(showToast("EDA Survey saved."));
      navigate("/submissions");
    },
    saveAndContinue() {
      if (!isEdaSegmentValid(currentId, record.eda)) {
        setShowErrors(true);
        setError(
          currentId === "training-provider"
            ? "Complete Sectoral Partnership, Training Provider, and at least one training program before continuing."
            : "Complete the required fields on this page before continuing.",
        );
        return;
      }
      setError("");
      setShowErrors(false);
      const nextIndex = Math.min(segmentIndex + 1, EDA_SEGMENTS.length - 1);
      dispatch(setEdaMaxStep({ periodId, step: segmentIndex === EDA_SEGMENTS.length - 1 ? nextIndex : nextIndex }));
      if (segmentIndex === EDA_SEGMENTS.length - 1) {
        navigate(`/submissions/${periodId}/eda/review`);
        return;
      }
      navigate(`/submissions/${periodId}/eda/${EDA_SEGMENT_IDS[nextIndex]}`);
    },
  };
}
