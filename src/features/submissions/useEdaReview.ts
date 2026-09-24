import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import {
  ADMISSIONS_COUNT_FIELDS,
  COMPLETION_COUNT_FIELDS,
  EARN_AND_LEARN_FIELDS,
  EDA_SEGMENTS,
  EMPLOYMENT_STATUS_FIELDS,
  EMPLOYMENT_TYPE_FIELDS,
  NON_COMPLETION_REASON_FIELDS,
  SALARIES_FIELDS,
  type EdaSegmentId,
} from "@/constants/eda";
import { getPeriodById } from "@/constants/periods";
import { formatSplitDate } from "@/lib/providerKnownData";
import { edaFillState, filledPrograms, participantSummary } from "@/lib/submissionDocuments";
import { getPeriodSubmission, setEdaMaxStep } from "@/store/submissionsSlice";
import { showToast } from "@/store/uiSlice";
import type { ProgramScoped } from "@/types/submissions";

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

function programHeading(item: ProgramScoped, index: number): string {
  return item.trainingProgram.trim() || `Program ${index + 1}`;
}

function scopedRows(item: ProgramScoped, extra: Array<{ label: string; value: string }>): Array<{ label: string; value: string }> {
  return [
    { label: "Name of Training Provider", value: display(item.trainingProvider) },
    { label: "Name of Training Program", value: display(item.trainingProgram) },
    ...extra,
  ];
}

export function useEdaReview(): EdaReviewSummary {
  const { periodId = "" } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const identity = useAppSelector((state) => state.auth.identity);
  const record = useAppSelector((state) => getPeriodSubmission(state.submissions, periodId));
  const period = getPeriodById(periodId);
  const draft = record.eda;

  const sections: EdaReviewSection[] = EDA_SEGMENTS.map((segment) => {
    const rows: Array<{ label: string; value: string }> = segment.fields.map((field) => ({
      label: field.label,
      value: display(draft[field.key]),
    }));

    if (segment.id === "training-provider") {
      rows.push({ label: "Training programs", value: filledPrograms(draft.trainingPrograms).join(" · ") || "—" });
    }

    if (segment.id === "participant-database") {
      if (draft.noParticipants) {
        rows.push({ label: "Participants", value: "No participants to register" });
      } else {
        draft.participants.forEach((person, index) => {
          rows.push({
            label: `Participant ${index + 1}`,
            value: `${participantSummary(person)}${person.street ? ` · ${person.street}, ${person.city}, ${person.state} ${person.zip}` : ""}${person.completedTraining ? ` · Completed: ${person.completedTraining}` : ""}${formatSplitDate(person.jobStart) ? ` · Job start: ${formatSplitDate(person.jobStart)}` : ""}`,
          });
        });
      }
    }

    if (segment.id === "institutional-information") {
      draft.institutional.forEach((item, index) => {
        rows.push({ label: programHeading(item, index), value: "Program section" });
        rows.push(
          ...scopedRows(item, [
            { label: "Length of Program", value: display(item.programLength) },
            { label: "Environment Type", value: display(item.environmentType) },
            { label: "Program Hours", value: item.programHours.join(" · ") || "—" },
            { label: "Soft skill training", value: display(item.softSkillTraining) },
            { label: "Program Tuition Cost (Actual Cost)", value: display(item.tuitionCost) },
            { label: "Type of Credential Attained", value: display(item.credentialType) },
          ]),
        );
      });
    }

    if (segment.id === "admissions") {
      draft.admissions.forEach((item, index) => {
        rows.push({ label: programHeading(item, index), value: "Program section" });
        rows.push(
          ...scopedRows(
            item,
            ADMISSIONS_COUNT_FIELDS.map((field) => ({ label: field.label, value: display(item[field.key]) })),
          ),
        );
      });
    }

    if (segment.id === "training-completion") {
      draft.completions.forEach((item, index) => {
        rows.push({ label: programHeading(item, index), value: "Program section" });
        rows.push(
          ...scopedRows(
            item,
            item.skipNoCompletions
              ? [{ label: "Completion counts", value: "Skipped — no participants completed training in the quarter" }]
              : COMPLETION_COUNT_FIELDS.map((field) => ({ label: field.label, value: display(item[field.key]) })),
          ),
        );
      });
    }

    if (segment.id === "reason-for-non-completion") {
      draft.nonCompletions.forEach((item, index) => {
        const reasonRows = item.skipReasons
          ? [{ label: "What was the reason for non-completion?", value: "Skipped — no participants to report in the quarter" }]
          : [
              ...NON_COMPLETION_REASON_FIELDS.map((field) => ({ label: field.label, value: display(item.reasons[field.key]) })),
              ...(Number(item.reasons.other) > 0
                ? [{ label: "Please specify", value: display(item.reasons.otherSpecify) }]
                : []),
            ];
        rows.push({ label: programHeading(item, index), value: "Program section" });
        rows.push(
          ...scopedRows(item, [
            { label: "How many GJC participants did not complete training in the program?", value: display(item.didNotComplete) },
            ...reasonRows,
          ]),
        );
      });
    }

    if (segment.id === "employment-type") {
      draft.employmentType.forEach((item, index) => {
        const typeRows = item.skipNoPlacements
          ? [{ label: "What is the employment type?", value: "Skipped — no participants were placed into a job in the quarter" }]
          : [
              ...EMPLOYMENT_TYPE_FIELDS.map((field) => ({ label: field.label, value: display(item.types[field.key]) })),
              ...(Number(item.types.other) > 0 ? [{ label: "Please specify", value: display(item.types.otherSpecify) }] : []),
            ];
        rows.push({ label: programHeading(item, index), value: "Program section" });
        rows.push(...scopedRows(item, typeRows));
      });
    }

    if (segment.id === "earn-and-learn") {
      draft.earnAndLearn.forEach((item, index) => {
        const modelRows = item.skipNoModels
          ? [{ label: "Earn and Learn models", value: "Skipped — no participants were involved in listed Earn and Learn programs" }]
          : [
              ...EARN_AND_LEARN_FIELDS.map((field) => ({ label: field.label, value: display(item.models[field.key]) })),
              ...(Number(item.models.other) > 0 ? [{ label: "Please specify", value: display(item.models.otherSpecify) }] : []),
            ];
        rows.push({ label: programHeading(item, index), value: "Program section" });
        rows.push(
          ...scopedRows(item, [
            { label: "Work-based learning opportunities (OJT more than 6 weeks)", value: display(item.workBasedLearning) },
            ...modelRows,
          ]),
        );
      });
    }

    if (segment.id === "salaries-of-participants") {
      draft.salaries.forEach((item, index) => {
        const salaryRows = item.skipNoSalaries
          ? [{ label: "Salaries of placed participants", value: "Skipped — no salaries to report in the quarter" }]
          : [
              ...SALARIES_FIELDS.map((field) => ({ label: field.label, value: item.medians[field.key].trim() ? `$${item.medians[field.key]}` : "—" })),
              ...(Number(item.medians.other) > 0 ? [{ label: "Please specify", value: display(item.medians.otherSpecify) }] : []),
            ];
        rows.push({ label: programHeading(item, index), value: "Program section" });
        rows.push(
          ...scopedRows(item, [
            ...salaryRows,
            { label: "What percent of employed participants reported their salaries?", value: display(item.reportedPercent) },
          ]),
        );
      });
    }

    if (segment.id === "employment-status-6-months") {
      draft.employmentStatus.forEach((item, index) => {
        const statusRows = item.skipNoStatus
          ? [{ label: "Employment status after six months", value: "Skipped — no participants to report after six months" }]
          : EMPLOYMENT_STATUS_FIELDS.map((field) => ({ label: field.label, value: display(item.statuses[field.key]) }));
        rows.push({ label: programHeading(item, index), value: "Program section" });
        rows.push(
          ...scopedRows(item, [
            ...statusRows,
            { label: "Top three job occupations after six months", value: display(item.topOccupations) },
            { label: "Top three employers after six months", value: display(item.topEmployers) },
          ]),
        );
      });
    }

    return { id: segment.id, title: segment.title, rows };
  });

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
