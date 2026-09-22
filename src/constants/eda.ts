import type { EdaSurveyDraft, InvoiceDraft } from "@/types/submissions";

export const EDA_SEGMENT_IDS = [
  "training-provider",
  "participant-database",
  "institutional-information",
  "admissions",
  "training-completion",
  "reason-for-non-completion",
  "employment-type",
  "earn-and-learn",
  "salaries-of-participants",
  "employment-status-6-months",
] as const;

export type EdaSegmentId = (typeof EDA_SEGMENT_IDS)[number];

export type EdaFieldType = "text" | "number" | "select" | "date" | "textarea";

export type EdaFieldKey = Exclude<keyof EdaSurveyDraft, "trainingPrograms">;

export type EdaField = {
  key: EdaFieldKey;
  label: string;
  required?: boolean;
  type: EdaFieldType;
  helper?: string;
  placeholder?: string;
  options?: readonly string[];
  full?: boolean;
};

export type EdaSegment = {
  id: EdaSegmentId;
  title: string;
  description: string;
  fields: EdaField[];
};

export const SECTORAL_PARTNERSHIPS = [
  "Piedmont-Triad Advanced Manufacturing Partnership",
  "Capital Area Healthcare Partnership",
  "Eastern Carolina Digital Skills Partnership",
  "Western NC Clean Energy Partnership",
  "Statewide Construction Trades Partnership",
] as const;

export const INSTITUTION_TYPES = [
  "Community college",
  "Workforce board",
  "Nonprofit training provider",
  "Employer-based provider",
] as const;

export const NON_COMPLETION_REASONS = [
  "Employment",
  "Family or personal",
  "Academic",
  "Relocation",
  "Unknown",
] as const;

export const EDA_SEGMENTS: EdaSegment[] = [
  {
    id: "training-provider",
    title: "Training Provider",
    description: "Confirm who is reporting and which programs this month covers. This section unlocks the rest of the survey.",
    fields: [
      {
        key: "sectoralPartnership",
        label: "Sectoral Partnership",
        required: true,
        type: "select",
        options: SECTORAL_PARTNERSHIPS,
        helper: "The regional partnership this provider reports through.",
        full: true,
      },
      {
        key: "trainingProvider",
        label: "Training Provider",
        required: true,
        type: "text",
        helper: "Use the legal or common name of the institution.",
        full: true,
      },
    ],
  },
  {
    id: "participant-database",
    title: "Participant Database",
    description: "A short count of who is in training this month so later outcome pages stay consistent.",
    fields: [
      { key: "enrolled", label: "Participants currently enrolled", required: true, type: "number", helper: "Headcount still in a program as of the as-of date." },
      { key: "newEnrollments", label: "New enrollments this month", required: true, type: "number" },
      { key: "exited", label: "Participants who exited", required: true, type: "number" },
      { key: "asOfDate", label: "Data as-of date", required: true, type: "date", helper: "Use the last calendar day of the reporting month when possible." },
    ],
  },
  {
    id: "institutional-information",
    title: "Institutional Information",
    description: "Identity details used to match this file to the grant record.",
    fields: [
      { key: "institutionType", label: "Institution type", required: true, type: "select", options: INSTITUTION_TYPES },
      { key: "uei", label: "Unique Entity ID (UEI)", required: true, type: "text", helper: "12-character SAM.gov identifier." },
      { key: "campusCity", label: "Primary campus city", required: true, type: "text" },
      { key: "county", label: "County", required: true, type: "text" },
    ],
  },
  {
    id: "admissions",
    title: "Admissions",
    description: "How many people applied, were accepted, and actually started.",
    fields: [
      { key: "applications", label: "Applications received", required: true, type: "number" },
      { key: "accepted", label: "Applicants accepted", required: true, type: "number" },
      { key: "started", label: "Applicants who started training", required: true, type: "number", full: true },
    ],
  },
  {
    id: "training-completion",
    title: "Training Completion",
    description: "Completions and credentials for this reporting month.",
    fields: [
      { key: "completions", label: "Training completions", required: true, type: "number" },
      { key: "credentials", label: "Credentials awarded", required: true, type: "number" },
      { key: "avgHours", label: "Average instructional hours completed", required: true, type: "number", full: true },
    ],
  },
  {
    id: "reason-for-non-completion",
    title: "Reason for non-completion",
    description: "If anyone left without completing, record the main reason. Enter 0 if everyone stayed or finished.",
    fields: [
      { key: "nonCompletions", label: "Non-completions this month", required: true, type: "number" },
      { key: "primaryReason", label: "Primary reason", type: "select", options: NON_COMPLETION_REASONS, helper: "Required when non-completions are greater than zero." },
      { key: "nonCompletionNotes", label: "Notes", type: "textarea", full: true, placeholder: "Optional context for reviewers." },
    ],
  },
  {
    id: "employment-type",
    title: "Employment Type",
    description: "Placement counts by employment type for participants who found work.",
    fields: [
      { key: "fullTime", label: "Full-time placements", required: true, type: "number" },
      { key: "partTime", label: "Part-time placements", required: true, type: "number" },
      { key: "selfEmployed", label: "Self-employed", required: true, type: "number" },
    ],
  },
  {
    id: "earn-and-learn",
    title: "Earn and Learn",
    description: "Paid learning models connected to this month’s cohort.",
    fields: [
      { key: "earnAndLearn", label: "Participants in earn-and-learn", required: true, type: "number" },
      { key: "apprenticeship", label: "Registered apprenticeship", required: true, type: "number" },
      { key: "ojt", label: "On-the-job training", required: true, type: "number" },
    ],
  },
  {
    id: "salaries-of-participants",
    title: "Salaries of participants",
    description: "Wage information for placed participants. Use hourly rates.",
    fields: [
      { key: "wageRecords", label: "Participants with wage data", required: true, type: "number" },
      { key: "medianWage", label: "Median hourly wage", required: true, type: "number", helper: "US dollars per hour." },
      { key: "wageMin", label: "Lowest starting wage", type: "number" },
      { key: "wageMax", label: "Highest starting wage", type: "number" },
    ],
  },
  {
    id: "employment-status-6-months",
    title: "Employment Status (6 months)",
    description: "Follow-up status for participants who reached the six-month mark.",
    fields: [
      { key: "employed6m", label: "Employed at 6 months", required: true, type: "number" },
      { key: "notEmployed6m", label: "Not employed at 6 months", required: true, type: "number" },
      { key: "unknown6m", label: "Unknown / could not contact", required: true, type: "number" },
    ],
  },
];

export const emptyEdaDraft = (): EdaSurveyDraft => ({
  sectoralPartnership: "",
  trainingProvider: "",
  trainingPrograms: [""],
  enrolled: "",
  newEnrollments: "",
  exited: "",
  asOfDate: "",
  institutionType: "",
  uei: "",
  campusCity: "",
  county: "",
  applications: "",
  accepted: "",
  started: "",
  completions: "",
  credentials: "",
  avgHours: "",
  nonCompletions: "",
  primaryReason: "",
  nonCompletionNotes: "",
  fullTime: "",
  partTime: "",
  selfEmployed: "",
  earnAndLearn: "",
  apprenticeship: "",
  ojt: "",
  wageRecords: "",
  medianWage: "",
  wageMin: "",
  wageMax: "",
  employed6m: "",
  notEmployed6m: "",
  unknown6m: "",
});

export const emptyInvoiceDraft = (): InvoiceDraft => ({
  invoiceNumber: "",
  amount: "",
  notes: "",
});

export const filledEdaDraft = (providerName: string): EdaSurveyDraft => ({
  sectoralPartnership: "Piedmont-Triad Advanced Manufacturing Partnership",
  trainingProvider: providerName,
  trainingPrograms: ["Advanced Manufacturing", "CNC Fundamentals"],
  enrolled: "18",
  newEnrollments: "4",
  exited: "3",
  asOfDate: "2026-08-31",
  institutionType: "Community college",
  uei: "PCC17NCA2T01",
  campusCity: "Roxboro",
  county: "Person",
  applications: "22",
  accepted: "19",
  started: "18",
  completions: "12",
  credentials: "11",
  avgHours: "86",
  nonCompletions: "2",
  primaryReason: "Employment",
  nonCompletionNotes: "Two participants accepted manufacturing jobs before completing the final module.",
  fullTime: "6",
  partTime: "1",
  selfEmployed: "0",
  earnAndLearn: "5",
  apprenticeship: "2",
  ojt: "3",
  wageRecords: "7",
  medianWage: "19.50",
  wageMin: "16.00",
  wageMax: "24.00",
  employed6m: "9",
  notEmployed6m: "1",
  unknown6m: "2",
});

export function isEdaSegmentId(value: string | undefined): value is EdaSegmentId {
  return Boolean(value && EDA_SEGMENT_IDS.includes(value as EdaSegmentId));
}
