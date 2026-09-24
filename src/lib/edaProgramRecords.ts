import type {
  AdmissionsProgram,
  CompletionProgram,
  EarnAndLearnCounts,
  EarnAndLearnProgram,
  EdaSurveyDraft,
  EmploymentStatusCounts,
  EmploymentStatusProgram,
  EmploymentTypeCounts,
  EmploymentTypeProgram,
  InstitutionalProgram,
  NonCompletionProgram,
  NonCompletionReasons,
  ProgramScoped,
  SalariesProgram,
  SalaryMedians,
} from "@/types/submissions";

function scoped(provider: string, program: string): ProgramScoped {
  return { trainingProvider: provider, trainingProgram: program };
}

export const emptyReasons = (): NonCompletionReasons => ({
  technicalRequirements: "0",
  familyObligations: "0",
  physicalHealth: "0",
  mentalHealth: "0",
  transportation: "0",
  childcare: "0",
  financialObligations: "0",
  behavior: "0",
  attendance: "0",
  startedJob: "0",
  other: "0",
  otherSpecify: "",
});

export const emptyInstitutional = (provider: string, program: string): InstitutionalProgram => ({
  ...scoped(provider, program),
  programLength: "",
  environmentType: "",
  programHours: [],
  softSkillTraining: "",
  tuitionCost: "",
  credentialType: "",
});

export const emptyAdmissions = (provider: string, program: string): AdmissionsProgram => ({
  ...scoped(provider, program),
  recruited: "0",
  admitted: "0",
  enrolled: "0",
});

export const emptyCompletion = (provider: string, program: string): CompletionProgram => ({
  ...scoped(provider, program),
  skipNoCompletions: false,
  completed: "0",
  completedOnTime: "0",
  completedNotContinuous: "0",
});

export const emptyNonCompletion = (provider: string, program: string): NonCompletionProgram => ({
  ...scoped(provider, program),
  didNotComplete: "0",
  skipReasons: false,
  reasons: emptyReasons(),
});

export const emptyEmploymentTypes = (): EmploymentTypeCounts => ({
  fullTime: "0",
  partTime: "0",
  seasonal: "0",
  earnAndLearn: "0",
  other: "0",
  otherSpecify: "",
});

export const emptyEmploymentType = (provider: string, program: string): EmploymentTypeProgram => ({
  ...scoped(provider, program),
  skipNoPlacements: false,
  types: emptyEmploymentTypes(),
});

export const emptyEarnAndLearnModels = (): EarnAndLearnCounts => ({
  registeredApprenticeship: "0",
  nonRegisteredApprenticeship: "0",
  internship: "0",
  customizedTraining: "0",
  incumbentWorker: "0",
  other: "0",
  otherSpecify: "",
});

export const emptyEarnAndLearn = (provider: string, program: string): EarnAndLearnProgram => ({
  ...scoped(provider, program),
  workBasedLearning: "",
  skipNoModels: false,
  models: emptyEarnAndLearnModels(),
});

export const emptySalaryMedians = (): SalaryMedians => ({
  fullTime: "0",
  partTime: "0",
  seasonal: "0",
  earnAndLearn: "0",
  other: "0",
  otherSpecify: "",
});

export const emptySalaries = (provider: string, program: string): SalariesProgram => ({
  ...scoped(provider, program),
  skipNoSalaries: false,
  medians: emptySalaryMedians(),
  reportedPercent: "",
});

export const emptyEmploymentStatuses = (): EmploymentStatusCounts => ({
  partnerInField: "0",
  nonPartnerInField: "0",
  stillSeeking: "0",
  notSeeking: "0",
  couldNotContact: "0",
});

export const emptyEmploymentStatus = (provider: string, program: string): EmploymentStatusProgram => ({
  ...scoped(provider, program),
  skipNoStatus: false,
  statuses: emptyEmploymentStatuses(),
  topOccupations: "",
  topEmployers: "",
});

function syncList<T extends ProgramScoped>(existing: T[] | undefined, programs: string[], provider: string, create: (provider: string, program: string) => T): T[] {
  const current = existing ?? [];
  return programs.map((program, index) => {
    const found = current[index];
    return found
      ? { ...found, trainingProvider: provider || found.trainingProvider, trainingProgram: program }
      : create(provider, program);
  });
}

export function syncProgramSections(draft: EdaSurveyDraft): Partial<EdaSurveyDraft> {
  const programs = draft.trainingPrograms.length > 0 ? draft.trainingPrograms : [""];
  const provider = draft.trainingProvider;
  return {
    institutional: syncList(draft.institutional, programs, provider, emptyInstitutional),
    admissions: syncList(draft.admissions, programs, provider, emptyAdmissions),
    completions: syncList(draft.completions, programs, provider, emptyCompletion),
    nonCompletions: syncList(draft.nonCompletions, programs, provider, emptyNonCompletion),
    employmentType: syncList(draft.employmentType, programs, provider, emptyEmploymentType),
    earnAndLearn: syncList(draft.earnAndLearn, programs, provider, emptyEarnAndLearn),
    salaries: syncList(draft.salaries, programs, provider, emptySalaries),
    employmentStatus: syncList(draft.employmentStatus, programs, provider, emptyEmploymentStatus),
  };
}

export function programListsNeedSync(draft: EdaSurveyDraft): boolean {
  const programs = draft.trainingPrograms.length > 0 ? draft.trainingPrograms : [""];
  const lists = [
    draft.institutional,
    draft.admissions,
    draft.completions,
    draft.nonCompletions,
    draft.employmentType,
    draft.earnAndLearn,
    draft.salaries,
    draft.employmentStatus,
  ];
  return lists.some((list) => {
    if (!list || list.length !== programs.length) return true;
    return list.some((item, index) => item.trainingProgram !== programs[index] || item.trainingProvider !== draft.trainingProvider);
  });
}
