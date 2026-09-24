import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { EDA_SEGMENTS, EDA_SEGMENT_IDS, isEdaSegmentId, type EdaFieldKey, type EdaSegmentId } from "@/constants/eda";
import { getPeriodById } from "@/constants/periods";
import { syncProgramSections } from "@/lib/edaProgramRecords";
import { applyKnownEdaDefaults, createEmptyParticipant, getProviderKnownData } from "@/lib/providerKnownData";
import { filledPrograms, isEdaSegmentValid, isTrainingProviderSegmentValid } from "@/lib/submissionDocuments";
import { getPeriodSubmission, saveEdaDraft, setEdaMaxStep, updateEda } from "@/store/submissionsSlice";
import { showToast } from "@/store/uiSlice";
import type { EdaParticipant, EdaSurveyDraft, NonCompletionReasons, SplitDate } from "@/types/submissions";

export type ProgramListKey =
  | "institutional"
  | "admissions"
  | "completions"
  | "nonCompletions"
  | "employmentType"
  | "earnAndLearn"
  | "salaries"
  | "employmentStatus";

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
  programOptions: string[];
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
  toggleNoParticipants: () => void;
  updateProgramRecord: <K extends ProgramListKey>(list: K, index: number, patch: Partial<EdaSurveyDraft[K][number]>) => void;
  toggleInstitutionalHour: (index: number, value: string) => void;
  toggleCompletionSkip: (index: number) => void;
  toggleNonCompletionSkip: (index: number) => void;
  updateNonCompletionReason: (index: number, key: keyof NonCompletionReasons, value: string) => void;
  updateParticipant: (index: number, patch: Partial<EdaParticipant>) => void;
  updateParticipantDate: (index: number, field: keyof Pick<EdaParticipant, "trainingStart" | "trainingEnd" | "jobStart" | "dateOfBirth">, part: keyof SplitDate, value: string) => void;
  addParticipant: () => void;
  removeParticipant: (index: number) => void;
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
  const organizationName = identity?.organizationName ?? "Training provider";
  const known = useMemo(() => getProviderKnownData(organizationName), [organizationName]);
  const programs = record.eda.trainingPrograms.length > 0 ? record.eda.trainingPrograms : known.programs.length ? known.programs : [""];
  const programOptions = Array.from(new Set([...known.programs, ...filledPrograms(record.eda.trainingPrograms)]));

  let redirectTo: string | null = null;
  if (!periodId || period.kind === "quarterly") redirectTo = "/submissions";
  else if (!isEdaSegmentId(segmentId)) redirectTo = `/submissions/${periodId}/eda/training-provider`;
  else if (segmentIndex > reachableIndex) redirectTo = `/submissions/${periodId}/eda/${EDA_SEGMENT_IDS[reachableIndex]}`;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentId]);

  useEffect(() => {
    if (!periodId) return;
    const patch = applyKnownEdaDefaults(record.eda, known, { year: period.year, month: period.month });
    if (Object.keys(patch).length > 0) {
      dispatch(updateEda({ periodId, patch }));
    }
  }, [dispatch, known, period.month, period.year, periodId, record.eda]);

  return {
    ready: !redirectTo,
    redirectTo,
    periodId,
    monthLabel: period.windowLabel,
    organizationName,
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
    programOptions,
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
      const name = event.target.name as EdaFieldKey;
      const value = event.target.value;
      const next = { ...record.eda, [name]: value };
      dispatch(
        updateEda({
          periodId,
          patch: name === "trainingProvider" ? { trainingProvider: value, ...syncProgramSections(next) } : { [name]: value },
        }),
      );
    },
    changeProgram(index, value) {
      const nextPrograms = [...programs];
      nextPrograms[index] = value;
      const next = { ...record.eda, trainingPrograms: nextPrograms };
      dispatch(updateEda({ periodId, patch: { trainingPrograms: nextPrograms, ...syncProgramSections(next) } }));
    },
    addProgram() {
      if (programs.length >= MAX_PROGRAMS) return;
      const nextPrograms = [...programs, ""];
      const next = { ...record.eda, trainingPrograms: nextPrograms };
      dispatch(updateEda({ periodId, patch: { trainingPrograms: nextPrograms, ...syncProgramSections(next) } }));
    },
    removeProgram(index) {
      if (programs.length <= 1) return;
      const nextPrograms = programs.filter((_, item) => item !== index);
      const next = { ...record.eda, trainingPrograms: nextPrograms };
      dispatch(updateEda({ periodId, patch: { trainingPrograms: nextPrograms, ...syncProgramSections(next) } }));
    },
    toggleNoParticipants() {
      dispatch(updateEda({ periodId, patch: { noParticipants: !record.eda.noParticipants } }));
    },
    updateProgramRecord(list, index, patch) {
      const current = record.eda[list] as Array<Record<string, unknown>>;
      const next = current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item));
      dispatch(updateEda({ periodId, patch: { [list]: next } as Partial<EdaSurveyDraft> }));
    },
    toggleInstitutionalHour(index, value) {
      const current = record.eda.institutional[index];
      if (!current) return;
      const programHours = current.programHours.includes(value)
        ? current.programHours.filter((item) => item !== value)
        : [...current.programHours, value];
      const institutional = record.eda.institutional.map((item, itemIndex) => (itemIndex === index ? { ...item, programHours } : item));
      dispatch(updateEda({ periodId, patch: { institutional } }));
    },
    toggleCompletionSkip(index) {
      const completions = record.eda.completions.map((item, itemIndex) =>
        itemIndex === index ? { ...item, skipNoCompletions: !item.skipNoCompletions } : item,
      );
      dispatch(updateEda({ periodId, patch: { completions } }));
    },
    toggleNonCompletionSkip(index) {
      const nonCompletions = record.eda.nonCompletions.map((item, itemIndex) =>
        itemIndex === index ? { ...item, skipReasons: !item.skipReasons } : item,
      );
      dispatch(updateEda({ periodId, patch: { nonCompletions } }));
    },
    updateNonCompletionReason(index, key, value) {
      const nonCompletions = record.eda.nonCompletions.map((item, itemIndex) =>
        itemIndex === index ? { ...item, reasons: { ...item.reasons, [key]: value } } : item,
      );
      dispatch(updateEda({ periodId, patch: { nonCompletions } }));
    },
    updateParticipant(index, patch) {
      const participants = record.eda.participants.map((person, item) => (item === index ? { ...person, ...patch } : person));
      dispatch(updateEda({ periodId, patch: { participants } }));
    },
    updateParticipantDate(index, field, part, value) {
      const participants = record.eda.participants.map((person, item) =>
        item === index ? { ...person, [field]: { ...person[field], [part]: value } } : person,
      );
      dispatch(updateEda({ periodId, patch: { participants } }));
    },
    addParticipant() {
      dispatch(
        updateEda({
          periodId,
          patch: {
            noParticipants: false,
            participants: [
              ...record.eda.participants,
              createEmptyParticipant(record.eda.trainingProvider || organizationName, programOptions[0] ?? ""),
            ],
          },
        }),
      );
    },
    removeParticipant(index) {
      dispatch(updateEda({ periodId, patch: { participants: record.eda.participants.filter((_, item) => item !== index) } }));
    },
    saveSubmission() {
      dispatch(saveEdaDraft({ periodId }));
      dispatch(showToast("EDA Survey saved."));
      navigate("/submissions");
    },
    saveAndContinue() {
      dispatch(saveEdaDraft({ periodId }));
      if (!isEdaSegmentValid(currentId, record.eda)) {
        setShowErrors(true);
        setError(
          currentId === "training-provider"
            ? "Complete Sectoral Partnership, Training Provider, and at least one training program before continuing."
            : "Complete the required fields on this page before continuing.",
        );
        dispatch(showToast("Saved completed fields. Finish the required items to continue."));
        return;
      }
      setError("");
      setShowErrors(false);
      const nextIndex = Math.min(segmentIndex + 1, EDA_SEGMENTS.length - 1);
      dispatch(setEdaMaxStep({ periodId, step: nextIndex }));
      if (segmentIndex === EDA_SEGMENTS.length - 1) {
        navigate(`/submissions/${periodId}/eda/review`);
        return;
      }
      navigate(`/submissions/${periodId}/eda/${EDA_SEGMENT_IDS[nextIndex]}`);
    },
  };
}
