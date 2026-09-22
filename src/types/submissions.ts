import type { IntakeDraft } from "@/types/domain";

export const MONTHLY_PACKAGE_STATUSES = ["Action Needed", "Submitted", "Approved"] as const;
export type MonthlyPackageStatus = (typeof MONTHLY_PACKAGE_STATUSES)[number];

export const DOCUMENT_FILL_STATES = ["filled", "Incomplete", "blank"] as const;
export type DocumentFillState = (typeof DOCUMENT_FILL_STATES)[number];

export type SubmissionDocumentKind = "technical-report" | "eda-survey" | "invoice";

export type InvoiceDraft = {
  invoiceNumber: string;
  amount: string;
  notes: string;
};

export type EdaSurveyDraft = {
  sectoralPartnership: string;
  trainingProvider: string;
  trainingPrograms: string[];
  enrolled: string;
  newEnrollments: string;
  exited: string;
  asOfDate: string;
  institutionType: string;
  uei: string;
  campusCity: string;
  county: string;
  applications: string;
  accepted: string;
  started: string;
  completions: string;
  credentials: string;
  avgHours: string;
  nonCompletions: string;
  primaryReason: string;
  nonCompletionNotes: string;
  fullTime: string;
  partTime: string;
  selfEmployed: string;
  earnAndLearn: string;
  apprenticeship: string;
  ojt: string;
  wageRecords: string;
  medianWage: string;
  wageMin: string;
  wageMax: string;
  employed6m: string;
  notEmployed6m: string;
  unknown6m: string;
};

export type PeriodSubmissionRecord = {
  status: MonthlyPackageStatus;
  technical: IntakeDraft;
  eda: EdaSurveyDraft;
  invoice: InvoiceDraft;
  edaMaxStep: number;
};

export type SubmissionDocument = {
  kind: SubmissionDocumentKind;
  label: string;
  state: DocumentFillState;
};
