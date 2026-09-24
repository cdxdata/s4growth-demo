import {
  emptyAdmissions,
  emptyCompletion,
  emptyEarnAndLearn,
  emptyEarnAndLearnModels,
  emptyEmploymentStatus,
  emptyEmploymentStatuses,
  emptyEmploymentType,
  emptyEmploymentTypes,
  emptyInstitutional,
  emptyNonCompletion,
  emptyReasons,
  emptySalaries,
  emptySalaryMedians,
} from "@/lib/edaProgramRecords";
import type {
  EarnAndLearnCounts,
  EdaParticipant,
  EdaSurveyDraft,
  EmploymentStatusCounts,
  EmploymentTypeCounts,
  InvoiceDraft,
  NonCompletionReasons,
  SalaryMedians,
} from "@/types/submissions";

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

export type EdaStringKey = {
  [K in keyof EdaSurveyDraft]: EdaSurveyDraft[K] extends string ? K : never;
}[keyof EdaSurveyDraft];

export type EdaFieldKey = EdaStringKey;

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

export const YES_NO = ["Yes", "No"] as const;

export const PROGRAM_LENGTHS = [
  "Less than 3 months",
  "3 - 6 months",
  "7 - 12 months",
  "13 - 24 months",
  "25 - 36 months",
  "37 - 48 months",
] as const;

export const ENVIRONMENT_TYPES = [
  "In-person",
  "Hybrid in-person and remote",
  "Permanently remote",
] as const;

export const PROGRAM_HOURS = [
  "Full time program",
  "Part time program",
  "Program has the option to take breaks and return",
] as const;

export const CREDENTIAL_TYPES = [
  "Title IV Degree (Post-secondary educational degrees and certifications)",
  "Title IV Certificate (Post-secondary educational degrees and certifications)",
  "Non-Title IV Degree (Post-secondary educational degrees and certifications)",
  "Non-Title IV Certifications (Post-secondary educational degrees and certifications)",
  "Micro-credentials (MOOC Providers)",
  "Occupational Licenses (Non-Academic Organizations)",
  "Occupational Certificates (Non-Academic Organizations)",
  "Registered Apprenticeships (Non-Academic Organizations)",
  "Unregistered Apprenticeships (Non-Academic Organizations)",
  "Coding Bootcamp Course Completion Certificate (Non-Academic Organizations)",
  "Online Course Completion Certificate (Non-Academic Organizations)",
  "Public School District Diplomas (Secondary Schools)",
] as const;

export const NON_COMPLETION_REASON_FIELDS: Array<{
  key: keyof Omit<NonCompletionReasons, "otherSpecify">;
  label: string;
}> = [
  { key: "technicalRequirements", label: "Participant(s) could not meet the technical requirements for graduation" },
  { key: "familyObligations", label: "Participant(s) withdrew due to family obligations" },
  { key: "physicalHealth", label: "Participant(s) withdrew due to physical health reasons" },
  { key: "mentalHealth", label: "Participant(s) withdrew due to mental health reasons" },
  { key: "transportation", label: "Participant(s) withdrew due to lack of adequate transportation" },
  { key: "childcare", label: "Participant(s) withdrew due to lack of childcare" },
  { key: "financialObligations", label: "Participant(s) withdrew due to financial obligations (e.g. has to get a full-time job)" },
  { key: "behavior", label: "Participant(s) were dismissed due to behavior" },
  { key: "attendance", label: "Participant(s) did not meet attendance requirements" },
  { key: "startedJob", label: "Participant(s) withdrew because they started a new job during training" },
  { key: "other", label: "Other" },
];

export const COMPLETION_COUNT_FIELDS = [
  {
    key: "completed" as const,
    label: "How many participants funded through the GJC completed training in the program?",
  },
  {
    key: "completedOnTime" as const,
    label: "How many GJC participants completed training on-time?",
  },
  {
    key: "completedNotContinuous" as const,
    label: "How many GJC participants completed training, but training was not continuous?",
  },
];

export const ADMISSIONS_COUNT_FIELDS = [
  { key: "recruited" as const, label: "How many GJC Participants were RECRUITED this quarter?" },
  { key: "admitted" as const, label: "How many GJC Participants were ADMITTED this quarter?" },
  { key: "enrolled" as const, label: "How many GJC Participants were ENROLLED this quarter?" },
];

export const EMPLOYMENT_TYPE_FIELDS: Array<{ key: keyof Omit<EmploymentTypeCounts, "otherSpecify">; label: string }> = [
  { key: "fullTime", label: "Full-time employment" },
  { key: "partTime", label: "Part-time employment" },
  { key: "seasonal", label: "Seasonal employment" },
  { key: "earnAndLearn", label: "Earn and Learn employment" },
  { key: "other", label: "Other" },
];

export const EARN_AND_LEARN_FIELDS: Array<{ key: keyof Omit<EarnAndLearnCounts, "otherSpecify">; label: string }> = [
  { key: "registeredApprenticeship", label: "Registered Apprenticeship" },
  { key: "nonRegisteredApprenticeship", label: "Non-registered Apprenticeship" },
  { key: "internship", label: "Internship" },
  { key: "customizedTraining", label: "Customized Training" },
  { key: "incumbentWorker", label: "Incumbent Worker Training" },
  { key: "other", label: "Other (e.g. Transitional Jobs, Cooperatives, Practicums, Residences, or Fellowships)" },
];

export const SALARY_MEDIAN_HELPER =
  "Provide the median (e.g. $25.00). Where no participant for a specific subfield, default is 0";

export const SALARIES_FIELDS: Array<{ key: keyof Omit<SalaryMedians, "otherSpecify">; label: string }> = [
  { key: "fullTime", label: "Median hourly earnings for full-time employment" },
  { key: "partTime", label: "Median hourly earnings for part-time employment" },
  { key: "seasonal", label: "Median hourly earnings for seasonal employment" },
  { key: "earnAndLearn", label: "Median hourly earnings for Earn and Learn employment" },
  { key: "other", label: "Other" },
];

export const EMPLOYMENT_STATUS_FIELDS: Array<{ key: keyof EmploymentStatusCounts; label: string }> = [
  { key: "partnerInField", label: "Employed in-field by an employer who partners with your training program" },
  { key: "nonPartnerInField", label: "Employed in-field by an employer who doesn't partner with your training program" },
  { key: "stillSeeking", label: "Still seeking employment in-field" },
  { key: "notSeeking", label: "Not seeking employment in-field" },
  { key: "couldNotContact", label: "Could not contact" },
];

export const NAICS_URL = "https://www.census.gov/naics/";

export const DATE_MONTHS = [
  { value: "01", label: "January" },
  { value: "02", label: "February" },
  { value: "03", label: "March" },
  { value: "04", label: "April" },
  { value: "05", label: "May" },
  { value: "06", label: "June" },
  { value: "07", label: "July" },
  { value: "08", label: "August" },
  { value: "09", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
] as const;

export const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
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
        helper: "",
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
    description: "Register each participant in this reporting month. Known names, programs, and dates are filled in for you.",
    fields: [],
  },
  {
    id: "institutional-information",
    title: "Institutional Information",
    description: "Describe each training program this report covers. Provider and program name are filled from the Training Provider page.",
    fields: [],
  },
  {
    id: "admissions",
    title: "Admissions",
    description: "Quarterly Good Jobs Challenge counts for each training program.",
    fields: [],
  },
  {
    id: "training-completion",
    title: "Training Completion",
    description: "GJC completion counts for each training program this quarter.",
    fields: [],
  },
  {
    id: "reason-for-non-completion",
    title: "Reason for non-completion",
    description: "Counts and reasons for GJC participants who did not complete each training program.",
    fields: [],
  },
  {
    id: "employment-type",
    title: "Employment Type",
    description: "Employment type counts for GJC participants placed into a job, reported for each training program.",
    fields: [],
  },
  {
    id: "earn-and-learn",
    title: "Earn and Learn",
    description: "Work-based learning and Earn and Learn model counts for each training program.",
    fields: [],
  },
  {
    id: "salaries-of-participants",
    title: "Salaries of participants",
    description: "Median hourly earnings for placed participants in each training program.",
    fields: [],
  },
  {
    id: "employment-status-6-months",
    title: "Employment Status (6 months)",
    description: "Six-month employment status, occupations, and employers for each training program.",
    fields: [],
  },
];

function sampleParticipant(provider: string): EdaParticipant {
  return {
    trainingProvider: provider,
    trainingProgram: "Advanced Manufacturing",
    firstName: "Maya",
    middleName: "R",
    lastName: "Foster",
    trainingStart: { month: "07", day: "12", year: "2026" },
    trainingEnd: { month: "08", day: "28", year: "2026" },
    completedTraining: "Yes",
    jobStart: { month: "09", day: "05", year: "2026" },
    dateOfBirth: { month: "03", day: "18", year: "1998" },
    street: "88 Gilbreath Road",
    street2: "",
    city: "Burlington",
    state: "NC",
    zip: "27215",
  };
}

export const emptyEdaDraft = (): EdaSurveyDraft => ({
  sectoralPartnership: "",
  trainingProvider: "",
  trainingPrograms: [""],
  noParticipants: false,
  participants: [],
  institutional: [],
  admissions: [],
  completions: [],
  nonCompletions: [],
  employmentType: [],
  earnAndLearn: [],
  salaries: [],
  employmentStatus: [],
});

export const emptyInvoiceDraft = (): InvoiceDraft => ({
  invoiceNumber: "",
  amount: "",
  notes: "",
});

function filledInstitutional(provider: string, program: string, tuition: string, hours: string[]) {
  return {
    ...emptyInstitutional(provider, program),
    programLength: "3 - 6 months",
    environmentType: "Hybrid in-person and remote",
    programHours: hours,
    softSkillTraining: "Yes",
    tuitionCost: tuition,
    credentialType: "Occupational Certificates (Non-Academic Organizations)",
  };
}

export const filledEdaDraft = (providerName: string): EdaSurveyDraft => {
  const programs = ["Advanced Manufacturing", "CNC Fundamentals"] as const;
  return {
    ...emptyEdaDraft(),
    sectoralPartnership: "Piedmont-Triad Advanced Manufacturing Partnership",
    trainingProvider: providerName,
    trainingPrograms: [...programs],
    noParticipants: false,
    participants: [sampleParticipant(providerName)],
    institutional: [
      filledInstitutional(providerName, programs[0], "4200", ["Full time program", "Program has the option to take breaks and return"]),
      filledInstitutional(providerName, programs[1], "3800", ["Part time program"]),
    ],
    admissions: [
      { ...emptyAdmissions(providerName, programs[0]), recruited: "14", admitted: "12", enrolled: "11" },
      { ...emptyAdmissions(providerName, programs[1]), recruited: "8", admitted: "7", enrolled: "7" },
    ],
    completions: [
      { ...emptyCompletion(providerName, programs[0]), completed: "8", completedOnTime: "7", completedNotContinuous: "1" },
      { ...emptyCompletion(providerName, programs[1]), completed: "4", completedOnTime: "3", completedNotContinuous: "0" },
    ],
    nonCompletions: [
      {
        ...emptyNonCompletion(providerName, programs[0]),
        didNotComplete: "2",
        reasons: { ...emptyReasons(), startedJob: "2" },
      },
      emptyNonCompletion(providerName, programs[1]),
    ],
    employmentType: [
      { ...emptyEmploymentType(providerName, programs[0]), types: { ...emptyEmploymentTypes(), fullTime: "4", partTime: "1", earnAndLearn: "2" } },
      { ...emptyEmploymentType(providerName, programs[1]), types: { ...emptyEmploymentTypes(), fullTime: "2" } },
    ],
    earnAndLearn: [
      {
        ...emptyEarnAndLearn(providerName, programs[0]),
        workBasedLearning: "Yes",
        models: { ...emptyEarnAndLearnModels(), registeredApprenticeship: "1", internship: "2", customizedTraining: "1" },
      },
      {
        ...emptyEarnAndLearn(providerName, programs[1]),
        workBasedLearning: "Yes",
        models: { ...emptyEarnAndLearnModels(), internship: "1", incumbentWorker: "1" },
      },
    ],
    salaries: [
      {
        ...emptySalaries(providerName, programs[0]),
        medians: { ...emptySalaryMedians(), fullTime: "19.50", partTime: "16.00", earnAndLearn: "18.00" },
        reportedPercent: "60",
      },
      {
        ...emptySalaries(providerName, programs[1]),
        medians: { ...emptySalaryMedians(), fullTime: "18.00" },
        reportedPercent: "55",
      },
    ],
    employmentStatus: [
      {
        ...emptyEmploymentStatus(providerName, programs[0]),
        statuses: { ...emptyEmploymentStatuses(), partnerInField: "4", nonPartnerInField: "2", stillSeeking: "1" },
        topOccupations: "332710, 333517, 423830",
        topEmployers: "Honda Precision Parts, GKN Driveline, local machine shops",
      },
      {
        ...emptyEmploymentStatus(providerName, programs[1]),
        statuses: { ...emptyEmploymentStatuses(), partnerInField: "2", couldNotContact: "1" },
        topOccupations: "333517, 332710",
        topEmployers: "GKN Driveline, Piedmont employers",
      },
    ],
  };
};

export function isEdaSegmentId(value: string | undefined): value is EdaSegmentId {
  return Boolean(value && EDA_SEGMENT_IDS.includes(value as EdaSegmentId));
}
