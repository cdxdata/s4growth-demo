import {
  ADMISSIONS_COUNT_FIELDS,
  COMPLETION_COUNT_FIELDS,
  DATE_MONTHS,
  EARN_AND_LEARN_FIELDS,
  EDA_SEGMENTS,
  EMPLOYMENT_STATUS_FIELDS,
  EMPLOYMENT_TYPE_FIELDS,
  NON_COMPLETION_REASON_FIELDS,
  PROGRAM_HOURS,
  SALARIES_FIELDS,
} from "@/constants/eda";
import type { EdaSurveyDraft, PeriodSubmissionRecord, SplitDate } from "@/types/submissions";

export type WorkbookHeaderGroup = {
  label: string;
  children?: string[];
};

export type WorkbookSheet = {
  name: string;
  groups: WorkbookHeaderGroup[];
  rows: Array<Array<string | number>>;
};

const DATE_CHILDREN = ["Month", "Day", "Year"] as const;
const ADDRESS_CHILDREN = ["Street", "Street (apt, etc)", "City", "State", "Zip"] as const;

const SKIP_NO_PARTICIPANTS = "There are no participants to register in this form";
const SKIP_COMPLETIONS = "Check box and skip section if no participants completed training in the quarter";
const SKIP_REASONS = "Check box and skip section if there are no participants to report in the quarter";
const SKIP_PLACEMENTS = "Check box and skip section if no participants were placed into a job in the quarter";
const SKIP_EARN_AND_LEARN =
  "Check box and skip section if no participants were involved in any of the listed Earn and Learn training program in the quarter";
const SKIP_SALARIES = "Check box and skip section if there are no salaries to report in the quarter";
const SKIP_STATUS = "Check box and skip section if there are no participants to report after six months";

const PROVIDER_NAME = "Name of Training Provider";
const PROGRAM_NAME = "Name of Training Program";
const PLEASE_SPECIFY = "Please specify";

function yesNo(value: boolean): string {
  return value ? "Yes" : "No";
}

function monthLabel(value: string): string {
  return DATE_MONTHS.find((month) => month.value === value)?.label ?? value;
}

function dateParts(value: SplitDate): Array<string | number> {
  return [monthLabel(value.month), value.day, value.year];
}

function emptyDate(): Array<string | number> {
  return ["", "", ""];
}

function draftsForQuarter(records: Record<string, PeriodSubmissionRecord>): EdaSurveyDraft[] {
  return Object.keys(records)
    .sort()
    .map((periodId) => records[periodId]?.eda)
    .filter((draft): draft is EdaSurveyDraft => Boolean(draft));
}

function programCount(drafts: EdaSurveyDraft[]): number {
  return Math.max(1, ...drafts.map((draft) => draft.trainingPrograms.length));
}

function scoped(item: { trainingProvider: string; trainingProgram: string }): Array<string | number> {
  return [item.trainingProvider, item.trainingProgram];
}

function trainingProviderSheet(drafts: EdaSurveyDraft[]): WorkbookSheet {
  const count = programCount(drafts);
  return {
    name: EDA_SEGMENTS[0].title,
    groups: [
      { label: "Sectoral Partnership" },
      { label: "Training Provider" },
      {
        label: "Training Program",
        children: Array.from({ length: count }, (_, index) => `Training Program ${index + 1}`),
      },
    ],
    rows: drafts.map((draft) => [
      draft.sectoralPartnership,
      draft.trainingProvider,
      ...Array.from({ length: count }, (_, index) => draft.trainingPrograms[index] ?? ""),
    ]),
  };
}

function participantSheet(drafts: EdaSurveyDraft[]): WorkbookSheet {
  return {
    name: EDA_SEGMENTS[1].title,
    groups: [
      { label: SKIP_NO_PARTICIPANTS },
      { label: "Training Provider" },
      { label: "Training Program" },
      { label: "First Name" },
      { label: "Middle Name" },
      { label: "Last Name" },
      { label: "Training Start Date", children: [...DATE_CHILDREN] },
      { label: "Training End Date", children: [...DATE_CHILDREN] },
      { label: "Completed Training" },
      { label: "Job Start Date", children: [...DATE_CHILDREN] },
      { label: "Date of Birth", children: [...DATE_CHILDREN] },
      { label: "Address of Residence", children: [...ADDRESS_CHILDREN] },
    ],
    rows: drafts.flatMap((draft) => {
      if (draft.noParticipants || draft.participants.length === 0) {
        return [[
          yesNo(true),
          "",
          "",
          "",
          "",
          "",
          ...emptyDate(),
          ...emptyDate(),
          "",
          ...emptyDate(),
          ...emptyDate(),
          "",
          "",
          "",
          "",
          "",
        ]];
      }
      return draft.participants.map((person) => [
        yesNo(false),
        person.trainingProvider,
        person.trainingProgram,
        person.firstName,
        person.middleName,
        person.lastName,
        ...dateParts(person.trainingStart),
        ...dateParts(person.trainingEnd),
        person.completedTraining,
        ...dateParts(person.jobStart),
        ...dateParts(person.dateOfBirth),
        person.street,
        person.street2,
        person.city,
        person.state,
        person.zip,
      ]);
    }),
  };
}

function institutionalSheet(drafts: EdaSurveyDraft[]): WorkbookSheet {
  return {
    name: EDA_SEGMENTS[2].title,
    groups: [
      { label: PROVIDER_NAME },
      { label: PROGRAM_NAME },
      { label: "Length of Program" },
      { label: "Environment Type" },
      { label: "Program Hours", children: [...PROGRAM_HOURS] },
      { label: "Does your training program include soft skill training?" },
      { label: "Program Tuition Cost (Actual Cost)" },
      { label: "Type of Credential Attained (based on WIOA statutory definitions)" },
    ],
    rows: drafts.flatMap((draft) =>
      draft.institutional.map((item) => [
        ...scoped(item),
        item.programLength,
        item.environmentType,
        ...PROGRAM_HOURS.map((option) => yesNo(item.programHours.includes(option))),
        item.softSkillTraining,
        item.tuitionCost,
        item.credentialType,
      ]),
    ),
  };
}

function admissionsSheet(drafts: EdaSurveyDraft[]): WorkbookSheet {
  return {
    name: EDA_SEGMENTS[3].title,
    groups: [
      { label: PROVIDER_NAME },
      { label: PROGRAM_NAME },
      ...ADMISSIONS_COUNT_FIELDS.map((field) => ({ label: field.label })),
    ],
    rows: drafts.flatMap((draft) =>
      draft.admissions.map((item) => [
        ...scoped(item),
        ...ADMISSIONS_COUNT_FIELDS.map((field) => item[field.key]),
      ]),
    ),
  };
}

function completionSheet(drafts: EdaSurveyDraft[]): WorkbookSheet {
  return {
    name: EDA_SEGMENTS[4].title,
    groups: [
      { label: PROVIDER_NAME },
      { label: PROGRAM_NAME },
      { label: SKIP_COMPLETIONS },
      ...COMPLETION_COUNT_FIELDS.map((field) => ({ label: field.label })),
    ],
    rows: drafts.flatMap((draft) =>
      draft.completions.map((item) => [
        ...scoped(item),
        yesNo(item.skipNoCompletions),
        ...COMPLETION_COUNT_FIELDS.map((field) => item[field.key]),
      ]),
    ),
  };
}

function nonCompletionSheet(drafts: EdaSurveyDraft[]): WorkbookSheet {
  return {
    name: EDA_SEGMENTS[5].title,
    groups: [
      { label: PROVIDER_NAME },
      { label: PROGRAM_NAME },
      { label: "How many GJC participants did not complete training in the program?" },
      {
        label: "What was the reason for non-completion?",
        children: [SKIP_REASONS, ...NON_COMPLETION_REASON_FIELDS.map((field) => field.label), PLEASE_SPECIFY],
      },
    ],
    rows: drafts.flatMap((draft) =>
      draft.nonCompletions.map((item) => [
        ...scoped(item),
        item.didNotComplete,
        yesNo(item.skipReasons),
        ...NON_COMPLETION_REASON_FIELDS.map((field) => item.reasons[field.key]),
        item.reasons.otherSpecify,
      ]),
    ),
  };
}

function employmentTypeSheet(drafts: EdaSurveyDraft[]): WorkbookSheet {
  return {
    name: EDA_SEGMENTS[6].title,
    groups: [
      { label: PROVIDER_NAME },
      { label: PROGRAM_NAME },
      {
        label: "What is the employment type?",
        children: [SKIP_PLACEMENTS, ...EMPLOYMENT_TYPE_FIELDS.map((field) => field.label), PLEASE_SPECIFY],
      },
    ],
    rows: drafts.flatMap((draft) =>
      draft.employmentType.map((item) => [
        ...scoped(item),
        yesNo(item.skipNoPlacements),
        ...EMPLOYMENT_TYPE_FIELDS.map((field) => item.types[field.key]),
        item.types.otherSpecify,
      ]),
    ),
  };
}

function earnAndLearnSheet(drafts: EdaSurveyDraft[]): WorkbookSheet {
  return {
    name: EDA_SEGMENTS[7].title,
    groups: [
      { label: PROVIDER_NAME },
      { label: PROGRAM_NAME },
      {
        label:
          "Does your program include work-based learning opportunities as defined as on-the-job training for more than 6 weeks?",
      },
      {
        label: "If Earn and Learn employment, provide the number of participants in the type of Earn and Learn model",
        children: [SKIP_EARN_AND_LEARN, ...EARN_AND_LEARN_FIELDS.map((field) => field.label), PLEASE_SPECIFY],
      },
    ],
    rows: drafts.flatMap((draft) =>
      draft.earnAndLearn.map((item) => [
        ...scoped(item),
        item.workBasedLearning,
        yesNo(item.skipNoModels),
        ...EARN_AND_LEARN_FIELDS.map((field) => item.models[field.key]),
        item.models.otherSpecify,
      ]),
    ),
  };
}

function salariesSheet(drafts: EdaSurveyDraft[]): WorkbookSheet {
  return {
    name: EDA_SEGMENTS[8].title,
    groups: [
      { label: PROVIDER_NAME },
      { label: PROGRAM_NAME },
      {
        label: "Salaries of placed participants",
        children: [SKIP_SALARIES, ...SALARIES_FIELDS.map((field) => field.label), PLEASE_SPECIFY],
      },
      { label: "What percent of employed participants reported their salaries?" },
    ],
    rows: drafts.flatMap((draft) =>
      draft.salaries.map((item) => [
        ...scoped(item),
        yesNo(item.skipNoSalaries),
        ...SALARIES_FIELDS.map((field) => item.medians[field.key]),
        item.medians.otherSpecify,
        item.reportedPercent,
      ]),
    ),
  };
}

function employmentStatusSheet(drafts: EdaSurveyDraft[]): WorkbookSheet {
  return {
    name: EDA_SEGMENTS[9].title,
    groups: [
      { label: PROVIDER_NAME },
      { label: PROGRAM_NAME },
      {
        label: "What is the employment status of Good Jobs Challenge-funded participants after SIX months of program completion?",
        children: [SKIP_STATUS, ...EMPLOYMENT_STATUS_FIELDS.map((field) => field.label)],
      },
      { label: "List the top three job occupations placed GJC participants are employed in after SIX months." },
      { label: "List the top three employers of Good Jobs Challenge-funded participants are employed with after SIX months." },
    ],
    rows: drafts.flatMap((draft) =>
      draft.employmentStatus.map((item) => [
        ...scoped(item),
        yesNo(item.skipNoStatus),
        ...EMPLOYMENT_STATUS_FIELDS.map((field) => item.statuses[field.key]),
        item.topOccupations,
        item.topEmployers,
      ]),
    ),
  };
}

export function buildEdaWorkbookSheets(records: Record<string, PeriodSubmissionRecord>): WorkbookSheet[] {
  const drafts = draftsForQuarter(records);
  return [
    trainingProviderSheet(drafts),
    participantSheet(drafts),
    institutionalSheet(drafts),
    admissionsSheet(drafts),
    completionSheet(drafts),
    nonCompletionSheet(drafts),
    employmentTypeSheet(drafts),
    earnAndLearnSheet(drafts),
    salariesSheet(drafts),
    employmentStatusSheet(drafts),
  ];
}

export function headerRows(groups: WorkbookHeaderGroup[]): { rows: unknown[][]; merges: string[] } {
  const top: unknown[] = [];
  const bottom: unknown[] = [];
  const merges: string[] = [];
  let column = 0;

  for (const group of groups) {
    const children = group.children ?? [];
    const span = children.length || 1;
    const start = columnName(column);
    if (children.length > 0) {
      top.push(group.label, ...Array.from({ length: span - 1 }, () => ""));
      bottom.push(...children);
      if (span > 1) merges.push(`${start}1:${columnName(column + span - 1)}1`);
    } else {
      top.push(group.label);
      bottom.push("");
      merges.push(`${start}1:${start}2`);
    }
    column += span;
  }

  return { rows: [top, bottom], merges };
}

function columnName(index: number): string {
  let result = "";
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
    result = String.fromCharCode(65 + ((value - 1) % 26)) + result;
  }
  return result;
}
