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
import { formatSplitDate } from "@/lib/providerKnownData";
import { filledPrograms } from "@/lib/submissionDocuments";
import type { EdaSurveyDraft, ProgramScoped } from "@/types/submissions";

export type EdaReviewRow = {
  label: string;
  value: string;
  fieldId?: string;
  heading?: boolean;
};

export type EdaReviewSection = {
  id: EdaSegmentId;
  title: string;
  rows: EdaReviewRow[];
};

function display(value: string): string {
  return value.trim() || "—";
}

function programHeading(item: ProgramScoped, index: number): string {
  return item.trainingProgram.trim() || `Program ${index + 1}`;
}

function scopedRows(item: ProgramScoped, extra: EdaReviewRow[]): EdaReviewRow[] {
  return [
    { label: "Name of Training Provider", value: display(item.trainingProvider) },
    { label: "Name of Training Program", value: display(item.trainingProgram) },
    ...extra,
  ];
}

function programTitleRow(sectionId: EdaSegmentId, item: ProgramScoped, index: number): EdaReviewRow {
  return {
    label: programHeading(item, index),
    value: "Program section",
    fieldId: `eda.${sectionId}.${index}`,
    heading: true,
  };
}

export function edaReviewSections(draft: EdaSurveyDraft): EdaReviewSection[] {
  return EDA_SEGMENTS.map((segment) => {
    const rows: EdaReviewRow[] = segment.fields.map((field) => ({
      label: field.label,
      value: display(draft[field.key]),
      fieldId: `eda.${segment.id}.${field.key}`,
    }));

    if (segment.id === "training-provider") {
      rows.push({
        label: "Training programs",
        value: filledPrograms(draft.trainingPrograms).join(" · ") || "—",
        fieldId: "eda.training-provider.trainingPrograms",
      });
    }

    if (segment.id === "participant-database") {
      if (draft.noParticipants) {
        rows.push({
          label: "Participants",
          value: "No participants to register",
          fieldId: "eda.participant-database.none",
        });
      } else {
        draft.participants.forEach((person, index) => {
          const fieldId = `eda.participant-database.${index}`;
          rows.push({
            label: `Participant ${index + 1}`,
            value: `${person.firstName} ${person.lastName}`.trim() || `Participant ${index + 1}`,
            fieldId,
            heading: true,
          });
          rows.push(
            { label: "Training Provider", value: display(person.trainingProvider) },
            { label: "Training Program", value: display(person.trainingProgram) },
            { label: "First Name", value: display(person.firstName) },
            { label: "Middle Name", value: display(person.middleName) },
            { label: "Last Name", value: display(person.lastName) },
            { label: "Training Start Date", value: formatSplitDate(person.trainingStart) || "—" },
            { label: "Training End Date", value: formatSplitDate(person.trainingEnd) || "—" },
            { label: "Completed Training", value: display(person.completedTraining) },
            { label: "Job Start Date", value: formatSplitDate(person.jobStart) || "—" },
            { label: "Date of Birth", value: formatSplitDate(person.dateOfBirth) || "—" },
            { label: "Street", value: display(person.street) },
            { label: "Street (apt, etc)", value: display(person.street2) },
            { label: "City", value: display(person.city) },
            { label: "State", value: display(person.state) },
            { label: "Zip", value: display(person.zip) },
          );
        });
      }
    }

    if (segment.id === "institutional-information") {
      draft.institutional.forEach((item, index) => {
        rows.push(programTitleRow(segment.id, item, index));
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
        rows.push(programTitleRow(segment.id, item, index));
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
        rows.push(programTitleRow(segment.id, item, index));
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
        rows.push(programTitleRow(segment.id, item, index));
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
        rows.push(programTitleRow(segment.id, item, index));
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
        rows.push(programTitleRow(segment.id, item, index));
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
              ...SALARIES_FIELDS.map((field) => ({
                label: field.label,
                value: item.medians[field.key].trim() ? `$${item.medians[field.key]}` : "—",
              })),
              ...(Number(item.medians.other) > 0 ? [{ label: "Please specify", value: display(item.medians.otherSpecify) }] : []),
            ];
        rows.push(programTitleRow(segment.id, item, index));
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
        rows.push(programTitleRow(segment.id, item, index));
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
}
