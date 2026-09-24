import type { IntakeDraft, SubmissionStatus } from "@/types/domain";

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

export type SplitDate = {
  month: string;
  day: string;
  year: string;
};

export type EdaParticipant = {
  trainingProvider: string;
  trainingProgram: string;
  firstName: string;
  middleName: string;
  lastName: string;
  trainingStart: SplitDate;
  trainingEnd: SplitDate;
  completedTraining: string;
  jobStart: SplitDate;
  dateOfBirth: SplitDate;
  street: string;
  street2: string;
  city: string;
  state: string;
  zip: string;
};

export type ProgramScoped = {
  trainingProvider: string;
  trainingProgram: string;
};

export type InstitutionalProgram = ProgramScoped & {
  programLength: string;
  environmentType: string;
  programHours: string[];
  softSkillTraining: string;
  tuitionCost: string;
  credentialType: string;
};

export type AdmissionsProgram = ProgramScoped & {
  recruited: string;
  admitted: string;
  enrolled: string;
};

export type CompletionProgram = ProgramScoped & {
  skipNoCompletions: boolean;
  completed: string;
  completedOnTime: string;
  completedNotContinuous: string;
};

export type NonCompletionReasons = {
  technicalRequirements: string;
  familyObligations: string;
  physicalHealth: string;
  mentalHealth: string;
  transportation: string;
  childcare: string;
  financialObligations: string;
  behavior: string;
  attendance: string;
  startedJob: string;
  other: string;
  otherSpecify: string;
};

export type NonCompletionProgram = ProgramScoped & {
  didNotComplete: string;
  skipReasons: boolean;
  reasons: NonCompletionReasons;
};

export type EmploymentTypeCounts = {
  fullTime: string;
  partTime: string;
  seasonal: string;
  earnAndLearn: string;
  other: string;
  otherSpecify: string;
};

export type EmploymentTypeProgram = ProgramScoped & {
  skipNoPlacements: boolean;
  types: EmploymentTypeCounts;
};

export type EarnAndLearnCounts = {
  registeredApprenticeship: string;
  nonRegisteredApprenticeship: string;
  internship: string;
  customizedTraining: string;
  incumbentWorker: string;
  other: string;
  otherSpecify: string;
};

export type EarnAndLearnProgram = ProgramScoped & {
  workBasedLearning: string;
  skipNoModels: boolean;
  models: EarnAndLearnCounts;
};

export type SalaryMedians = {
  fullTime: string;
  partTime: string;
  seasonal: string;
  earnAndLearn: string;
  other: string;
  otherSpecify: string;
};

export type SalariesProgram = ProgramScoped & {
  skipNoSalaries: boolean;
  medians: SalaryMedians;
  reportedPercent: string;
};

export type EmploymentStatusCounts = {
  partnerInField: string;
  nonPartnerInField: string;
  stillSeeking: string;
  notSeeking: string;
  couldNotContact: string;
};

export type EmploymentStatusProgram = ProgramScoped & {
  skipNoStatus: boolean;
  statuses: EmploymentStatusCounts;
  topOccupations: string;
  topEmployers: string;
};

export type EdaSurveyDraft = {
  sectoralPartnership: string;
  trainingProvider: string;
  trainingPrograms: string[];
  noParticipants: boolean;
  participants: EdaParticipant[];
  institutional: InstitutionalProgram[];
  admissions: AdmissionsProgram[];
  completions: CompletionProgram[];
  nonCompletions: NonCompletionProgram[];
  employmentType: EmploymentTypeProgram[];
  earnAndLearn: EarnAndLearnProgram[];
  salaries: SalariesProgram[];
  employmentStatus: EmploymentStatusProgram[];
};

export type FormScore = "Passed" | "Flagged";
export type FieldMark = "good" | "bad";
export type ReviewFormId = SubmissionDocumentKind;

export type FormReviewState = {
  score: FormScore | null;
  fieldMarks: Record<string, FieldMark>;
};

export type EdaFormReviewState = FormReviewState & {
  sections: Record<string, FormReviewState>;
};

export type PackageReview = {
  "technical-report": FormReviewState;
  "eda-survey": EdaFormReviewState;
  invoice: FormReviewState;
};

export type ReviewAttachment = {
  name: string;
  href: string;
  sizeLabel?: string;
};

export type ReviewField = {
  id: string;
  label: string;
  value: string;
  sectionId?: string;
  sectionTitle?: string;
  link?: string;
  attachments?: ReviewAttachment[];
};

export type ProviderPeriodStatus = {
  status: SubmissionStatus;
  statusChangedOn: string | null;
  completedOn: string | null;
};

export type ReviewMail = {
  id: string;
  periodId: string;
  providerId: number;
  recipients: string[];
  subject: string;
  body: string;
  sentOn: string;
  status: SubmissionStatus;
};

export type PeriodSubmissionRecord = {
  status: MonthlyPackageStatus;
  technical: IntakeDraft;
  eda: EdaSurveyDraft;
  invoice: InvoiceDraft;
  edaMaxStep: number;
  review: PackageReview;
  reviewPublished?: string | null;
};

export type SubmissionDocument = {
  kind: SubmissionDocumentKind;
  label: string;
  state: DocumentFillState;
};
