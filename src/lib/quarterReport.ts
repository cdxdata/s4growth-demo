import {
  ADMISSIONS_COUNT_FIELDS,
  COMPLETION_COUNT_FIELDS,
  EARN_AND_LEARN_FIELDS,
  EDA_SEGMENTS,
  EMPLOYMENT_STATUS_FIELDS,
  EMPLOYMENT_TYPE_FIELDS,
  NON_COMPLETION_REASON_FIELDS,
  PROGRAM_HOURS,
  SALARIES_FIELDS,
} from "@/constants/eda";
import { MONTH_NAMES, type ReportingPeriod } from "@/constants/periods";
import { quarterMonthIds } from "@/lib/quarterAssembler";
import { ACHIEVEMENT_KEYWORDS, CHALLENGE_KEYWORDS, technicalHasStarted, technicalNarratives } from "@/lib/technicalReport";
import type { PeriodSubmissionRecord } from "@/types/submissions";

export type ReportField = {
  label: string;
  value: string | number;
};

export type ReportBlock = {
  title?: string;
  fields: ReportField[];
};

export type ReportPage = {
  number: number;
  title: string;
  eyebrow: string;
  description: string;
  narrative: string;
  blocks: ReportBlock[];
};

export type QuarterReport = {
  quarterLabel: string;
  windowLabel: string;
  organizationName: string;
  sourceLine: string;
  pages: ReportPage[];
};

type MonthRecord = {
  periodId: string;
  monthLabel: string;
  providerId: string;
  record: PeriodSubmissionRecord;
};

function number(value: string | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function listed(values: string[], empty = "None reported"): string {
  return unique(values).join("; ") || empty;
}

function average(values: number[]): number {
  const usable = values.filter((value) => value > 0);
  if (!usable.length) return 0;
  return Math.round((usable.reduce((total, value) => total + value, 0) / usable.length) * 100) / 100;
}

function money(value: number): string {
  return value ? `$${value.toFixed(2)}` : "$0.00";
}

function collectMonths(
  quarter: ReportingPeriod,
  byProvider: Record<string, Record<string, PeriodSubmissionRecord>>,
): MonthRecord[] {
  const ids = quarterMonthIds(quarter);
  return Object.entries(byProvider).flatMap(([providerId, periods]) =>
    ids.flatMap((periodId) => {
      const record = periods[periodId];
      if (!record) return [];
      return [
        {
          periodId,
          providerId,
          record,
          monthLabel: `${MONTH_NAMES[Number(periodId.slice(-2)) - 1]} ${quarter.year}`,
        },
      ];
    }),
  );
}

function sumBy<T>(items: T[], select: (item: T) => number): number {
  return items.reduce((total, item) => total + select(item), 0);
}

function narrative(lead: string, fields: ReportField[]): string {
  const body = fields.map((field) => `${field.label}: ${field.value}`).join(". ");
  return body ? `${lead} ${body}.` : lead;
}

function page(
  number: number,
  title: string,
  eyebrow: string,
  description: string,
  fields: ReportField[],
  extra: ReportBlock[] = [],
): ReportPage {
  return {
    number,
    title,
    eyebrow,
    description,
    narrative: narrative(description, fields),
    blocks: [{ fields }, ...extra],
  };
}

export function buildQuarterReport(
  quarter: ReportingPeriod,
  byProvider: Record<string, Record<string, PeriodSubmissionRecord>>,
  organizationName: string,
): QuarterReport {
  const months = collectMonths(quarter, byProvider);
  const drafts = months.map((item) => item.record.eda);
  const technical = months
    .filter((item) => technicalHasStarted(item.record.technical))
    .map((item) => ({ monthLabel: item.monthLabel, ...technicalNarratives(item.record.technical) }));

  const participants = drafts.flatMap((draft) => (draft.noParticipants ? [] : draft.participants));
  const admissions = drafts.flatMap((draft) => draft.admissions);
  const completions = drafts.flatMap((draft) => draft.completions);
  const nonCompletions = drafts.flatMap((draft) => draft.nonCompletions);
  const employment = drafts.flatMap((draft) => draft.employmentType);
  const earn = drafts.flatMap((draft) => draft.earnAndLearn);
  const salaries = drafts.flatMap((draft) => draft.salaries);
  const status = drafts.flatMap((draft) => draft.employmentStatus);
  const institutional = drafts.flatMap((draft) => draft.institutional);

  const enrolled = sumBy(admissions, (row) => number(row.enrolled));
  const completed = sumBy(completions, (row) => number(row.completed));
  const placements = sumBy(employment, (row) =>
    EMPLOYMENT_TYPE_FIELDS.reduce((total, field) => total + number(row.types[field.key]), 0),
  );

  const coverFields: ReportField[] = [
    { label: "Reporting recipient", value: organizationName },
    { label: "Award / program", value: "Steps4Growth · Good Jobs Challenge" },
    { label: "Reporting window", value: quarter.windowLabel },
    { label: "Monthly packets included", value: months.length },
    { label: "Participants registered", value: participants.length },
    { label: "How many GJC Participants were ENROLLED this quarter?", value: enrolled },
    { label: "How many participants funded through the GJC completed training in the program?", value: completed },
    { label: "Participants placed into employment", value: placements },
  ];

  const providerFields: ReportField[] = [
    { label: "Sectoral Partnership", value: listed(drafts.map((draft) => draft.sectoralPartnership)) },
    { label: "Training Provider", value: listed(drafts.map((draft) => draft.trainingProvider)) },
    { label: "Training Program", value: listed(drafts.flatMap((draft) => draft.trainingPrograms)) },
  ];

  const participantFields: ReportField[] = [
    { label: "There are no participants to register in this form", value: drafts.filter((draft) => draft.noParticipants).length },
    { label: "Training Provider", value: listed(participants.map((person) => person.trainingProvider)) },
    { label: "Training Program", value: listed(participants.map((person) => person.trainingProgram)) },
    { label: "Participants registered", value: participants.length },
    { label: "Completed Training", value: participants.filter((person) => person.completedTraining === "Yes").length },
    { label: "First Name / Last Name records", value: participants.filter((person) => person.firstName.trim() && person.lastName.trim()).length },
  ];

  const institutionalFields: ReportField[] = [
    { label: "Name of Training Provider", value: listed(institutional.map((item) => item.trainingProvider)) },
    { label: "Name of Training Program", value: listed(institutional.map((item) => item.trainingProgram)) },
    { label: "Length of Program", value: listed(institutional.map((item) => item.programLength)) },
    { label: "Environment Type", value: listed(institutional.map((item) => item.environmentType)) },
    ...PROGRAM_HOURS.map((option) => ({
      label: `Program Hours · ${option}`,
      value: institutional.filter((item) => item.programHours.includes(option)).length,
    })),
    {
      label: "Does your training program include soft skill training?",
      value: institutional.filter((item) => item.softSkillTraining === "Yes").length,
    },
    {
      label: "Program Tuition Cost (Actual Cost)",
      value: money(average(institutional.map((item) => number(item.tuitionCost)))),
    },
    {
      label: "Type of Credential Attained (based on WIOA statutory definitions)",
      value: listed(institutional.map((item) => item.credentialType)),
    },
  ];

  const admissionsFields: ReportField[] = ADMISSIONS_COUNT_FIELDS.map((field) => ({
    label: field.label,
    value: sumBy(admissions, (row) => number(row[field.key])),
  }));

  const completionFields: ReportField[] = [
    {
      label: "Check box and skip section if no participants completed training in the quarter",
      value: completions.filter((item) => item.skipNoCompletions).length,
    },
    ...COMPLETION_COUNT_FIELDS.map((field) => ({
      label: field.label,
      value: sumBy(completions, (row) => number(row[field.key])),
    })),
  ];

  const reasonFields: ReportField[] = [
    {
      label: "How many GJC participants did not complete training in the program?",
      value: sumBy(nonCompletions, (row) => number(row.didNotComplete)),
    },
    {
      label: "Check box and skip section if there are no participants to report in the quarter",
      value: nonCompletions.filter((item) => item.skipReasons).length,
    },
    ...NON_COMPLETION_REASON_FIELDS.map((field) => ({
      label: field.label,
      value: sumBy(nonCompletions, (row) => number(row.reasons[field.key])),
    })),
  ];

  const employmentFields: ReportField[] = [
    {
      label: "Check box and skip section if no participants were placed into a job in the quarter",
      value: employment.filter((item) => item.skipNoPlacements).length,
    },
    ...EMPLOYMENT_TYPE_FIELDS.map((field) => ({
      label: field.label,
      value: sumBy(employment, (row) => number(row.types[field.key])),
    })),
  ];

  const earnFields: ReportField[] = [
    {
      label:
        "Does your program include work-based learning opportunities as defined as on-the-job training for more than 6 weeks?",
      value: earn.filter((item) => item.workBasedLearning === "Yes").length,
    },
    {
      label:
        "Check box and skip section if no participants were involved in any of the listed Earn and Learn training program in the quarter",
      value: earn.filter((item) => item.skipNoModels).length,
    },
    ...EARN_AND_LEARN_FIELDS.map((field) => ({
      label: field.label,
      value: sumBy(earn, (row) => number(row.models[field.key])),
    })),
  ];

  const salaryFields: ReportField[] = [
    {
      label: "Check box and skip section if there are no salaries to report in the quarter",
      value: salaries.filter((item) => item.skipNoSalaries).length,
    },
    ...SALARIES_FIELDS.map((field) => ({
      label: field.label,
      value: money(average(salaries.map((row) => number(row.medians[field.key])))),
    })),
    {
      label: "What percent of employed participants reported their salaries?",
      value: `${average(salaries.map((row) => number(row.reportedPercent)))}%`,
    },
  ];

  const statusFields: ReportField[] = [
    {
      label: "Check box and skip section if there are no participants to report after six months",
      value: status.filter((item) => item.skipNoStatus).length,
    },
    ...EMPLOYMENT_STATUS_FIELDS.map((field) => ({
      label: field.label,
      value: sumBy(status, (row) => number(row.statuses[field.key])),
    })),
    {
      label: "List the top three job occupations placed GJC participants are employed in after SIX months.",
      value: listed(status.map((item) => item.topOccupations)),
    },
    {
      label: "List the top three employers of Good Jobs Challenge-funded participants are employed with after SIX months.",
      value: listed(status.map((item) => item.topEmployers)),
    },
  ];

  const joinNarrative = (key: "achievements" | "challenges" | "plan" | "story") =>
    technical.map((item) => item[key]).filter((value) => value && value !== "None").join(" ") || "None submitted this quarter.";

  const technicalFields: ReportField[] = [
    ...ACHIEVEMENT_KEYWORDS.filter((keyword) => keyword !== "None").map((keyword) => ({
      label: keyword,
      value: technical.some((item) => item.achievements.includes(keyword)) ? "Reported" : "Not used",
    })),
    ...CHALLENGE_KEYWORDS.filter((keyword) => keyword !== "None").map((keyword) => ({
      label: keyword,
      value: technical.some((item) => item.challenges.includes(keyword)) ? "Reported" : "Not used",
    })),
  ];

  const pages: ReportPage[] = [
    page(
      1,
      "Program Progress Report",
      "Cover",
      "Twelve-page quarterly draft assembled from monthly EDA Survey and technical report submissions. Number fields are the three-month totals from all participant data packets in this window.",
      coverFields,
    ),
    page(2, EDA_SEGMENTS[0].title, "EDA Survey", EDA_SEGMENTS[0].description, providerFields),
    page(3, EDA_SEGMENTS[1].title, "EDA Survey", EDA_SEGMENTS[1].description, participantFields),
    page(4, EDA_SEGMENTS[2].title, "EDA Survey", EDA_SEGMENTS[2].description, institutionalFields),
    page(5, EDA_SEGMENTS[3].title, "EDA Survey", EDA_SEGMENTS[3].description, admissionsFields),
    page(6, EDA_SEGMENTS[4].title, "EDA Survey", EDA_SEGMENTS[4].description, completionFields),
    page(7, EDA_SEGMENTS[5].title, "EDA Survey", EDA_SEGMENTS[5].description, reasonFields),
    page(8, EDA_SEGMENTS[6].title, "EDA Survey", EDA_SEGMENTS[6].description, employmentFields),
    page(9, EDA_SEGMENTS[7].title, "EDA Survey", EDA_SEGMENTS[7].description, earnFields),
    page(10, EDA_SEGMENTS[8].title, "EDA Survey", EDA_SEGMENTS[8].description, salaryFields),
    page(11, EDA_SEGMENTS[9].title, "EDA Survey", EDA_SEGMENTS[9].description, statusFields),
    {
      number: 12,
      title: "Technical report",
      eyebrow: "Narrative",
      description:
        "Shell narratives use the technical report keywords — Enrollment, Staffing, Retention, Funding, Data Collection, Job placement, Training completion, New employer partnership, and Braided funding secured — together with monthly plan and success-story fields.",
      narrative: [
        `Achievements. ${joinNarrative("achievements")}`,
        `Challenges. ${joinNarrative("challenges")}`,
        `Action plan. ${joinNarrative("plan")}`,
        `Success story. ${joinNarrative("story")}`,
      ].join(" "),
      blocks: [
        { title: "Keywords used this quarter", fields: technicalFields },
        {
          title: "Assembled narrative",
          fields: [
            { label: "Job placement / Training completion / New employer partnership", value: joinNarrative("achievements") },
            { label: "Enrollment / Staffing / Retention / Funding / Data Collection", value: joinNarrative("challenges") },
            { label: "Action plan and potential performance gain", value: joinNarrative("plan") },
            { label: "Success story / media", value: joinNarrative("story") },
          ],
        },
      ],
    },
  ];

  return {
    quarterLabel: `Q${quarter.quarter} ${quarter.year}`,
    windowLabel: quarter.windowLabel,
    organizationName,
    sourceLine: months.length
      ? months
          .map((item) => `${item.monthLabel} (${item.record.status})`)
          .filter((value, index, list) => list.indexOf(value) === index)
          .join(" · ")
      : "No monthly packets in this quarter",
    pages,
  };
}
