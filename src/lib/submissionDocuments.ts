import {
  EARN_AND_LEARN_FIELDS,
  EDA_SEGMENTS,
  EMPLOYMENT_STATUS_FIELDS,
  EMPLOYMENT_TYPE_FIELDS,
  NON_COMPLETION_REASON_FIELDS,
  SALARIES_FIELDS,
  type EdaSegmentId,
} from "@/constants/eda";
import { formatSplitDate, isSplitDateComplete } from "@/lib/providerKnownData";
import { isTechnicalDraftValid, technicalHasStarted } from "@/lib/technicalReport";
import type { IntakeDraft } from "@/types/domain";
import type {
  AdmissionsProgram,
  CompletionProgram,
  DocumentFillState,
  EarnAndLearnProgram,
  EdaParticipant,
  EdaSurveyDraft,
  EmploymentStatusProgram,
  EmploymentTypeProgram,
  InstitutionalProgram,
  InvoiceDraft,
  NonCompletionProgram,
  PeriodSubmissionRecord,
  ProgramScoped,
  SalariesProgram,
  SubmissionDocument,
} from "@/types/submissions";

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function isNonNegativeNumber(value: string): boolean {
  if (!hasText(value)) return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0;
}

export function filledPrograms(programs: string[]): string[] {
  return programs.map((program) => program.trim()).filter(Boolean);
}

export function technicalFillState(draft: IntakeDraft): DocumentFillState {
  if (isTechnicalDraftValid(draft)) return "filled";
  if (technicalHasStarted(draft)) return "Incomplete";
  return "blank";
}

export function isTechnicalValid(draft: IntakeDraft): boolean {
  return isTechnicalDraftValid(draft);
}

export function isTrainingProviderSegmentValid(draft: EdaSurveyDraft): boolean {
  return hasText(draft.sectoralPartnership) && hasText(draft.trainingProvider) && filledPrograms(draft.trainingPrograms).length >= 1;
}

function hasProgramSections<T extends ProgramScoped>(list: T[] | undefined, draft: EdaSurveyDraft): boolean {
  return Boolean(list && list.length > 0 && list.length === (draft.trainingPrograms.length > 0 ? draft.trainingPrograms.length : 1));
}

function isScopedNamed(item: ProgramScoped): boolean {
  return hasText(item.trainingProvider) && hasText(item.trainingProgram);
}

export function isInstitutionalProgramValid(item: InstitutionalProgram): boolean {
  return (
    isScopedNamed(item) &&
    hasText(item.programLength) &&
    hasText(item.environmentType) &&
    item.programHours.length > 0 &&
    hasText(item.softSkillTraining) &&
    isNonNegativeNumber(item.tuitionCost) &&
    hasText(item.credentialType)
  );
}

export function isAdmissionsProgramValid(item: AdmissionsProgram): boolean {
  return isScopedNamed(item) && isNonNegativeNumber(item.recruited) && isNonNegativeNumber(item.admitted) && isNonNegativeNumber(item.enrolled);
}

export function isCompletionProgramValid(item: CompletionProgram): boolean {
  if (!isScopedNamed(item)) return false;
  if (item.skipNoCompletions) return true;
  return isNonNegativeNumber(item.completed) && isNonNegativeNumber(item.completedOnTime) && isNonNegativeNumber(item.completedNotContinuous);
}

export function isNonCompletionProgramValid(item: NonCompletionProgram): boolean {
  if (!isScopedNamed(item) || !isNonNegativeNumber(item.didNotComplete)) return false;
  if (item.skipReasons) return true;
  const reasonsOk = NON_COMPLETION_REASON_FIELDS.every((field) => isNonNegativeNumber(item.reasons[field.key]));
  if (!reasonsOk) return false;
  if (Number(item.reasons.other) > 0 && !hasText(item.reasons.otherSpecify)) return false;
  return true;
}

function isPercent(value: string): boolean {
  const cleaned = value.trim().replace(/%$/, "");
  if (!hasText(cleaned)) return false;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 100;
}

export function isEmploymentTypeValid(item: EmploymentTypeProgram): boolean {
  if (!isScopedNamed(item)) return false;
  if (item.skipNoPlacements) return true;
  const countsOk = EMPLOYMENT_TYPE_FIELDS.every((field) => isNonNegativeNumber(item.types[field.key]));
  if (!countsOk) return false;
  return Number(item.types.other) === 0 || hasText(item.types.otherSpecify);
}

export function isEarnAndLearnValid(item: EarnAndLearnProgram): boolean {
  if (!isScopedNamed(item) || !hasText(item.workBasedLearning)) return false;
  if (item.skipNoModels) return true;
  const countsOk = EARN_AND_LEARN_FIELDS.every((field) => isNonNegativeNumber(item.models[field.key]));
  if (!countsOk) return false;
  return Number(item.models.other) === 0 || hasText(item.models.otherSpecify);
}

export function isSalariesValid(item: SalariesProgram): boolean {
  if (!isScopedNamed(item)) return false;
  if (item.skipNoSalaries) return true;
  const mediansOk = SALARIES_FIELDS.every((field) => isNonNegativeNumber(item.medians[field.key]));
  if (!mediansOk || !isPercent(item.reportedPercent)) return false;
  return Number(item.medians.other) === 0 || hasText(item.medians.otherSpecify);
}

export function isEmploymentStatusValid(item: EmploymentStatusProgram): boolean {
  if (!isScopedNamed(item)) return false;
  if (item.skipNoStatus) return true;
  const countsOk = EMPLOYMENT_STATUS_FIELDS.every((field) => isNonNegativeNumber(item.statuses[field.key]));
  return countsOk && hasText(item.topOccupations) && hasText(item.topEmployers);
}

export function isValidZip(value: string): boolean {
  return /^\d{5}$/.test(value.trim());
}

export function isParticipantValid(person: EdaParticipant): boolean {
  return (
    hasText(person.trainingProvider) &&
    hasText(person.trainingProgram) &&
    hasText(person.firstName) &&
    hasText(person.lastName) &&
    isSplitDateComplete(person.trainingStart) &&
    (person.completedTraining !== "Yes" || isSplitDateComplete(person.trainingEnd)) &&
    hasText(person.completedTraining) &&
    hasText(person.street) &&
    hasText(person.city) &&
    hasText(person.state) &&
    isValidZip(person.zip)
  );
}

function isParticipantDatabaseValid(draft: EdaSurveyDraft): boolean {
  if (draft.noParticipants) return true;
  return draft.participants.length > 0 && draft.participants.every(isParticipantValid);
}

export function isEdaSegmentValid(segmentId: EdaSegmentId, draft: EdaSurveyDraft): boolean {
  if (segmentId === "training-provider") return isTrainingProviderSegmentValid(draft);
  if (segmentId === "participant-database") return isParticipantDatabaseValid(draft);
  if (segmentId === "institutional-information") {
    return hasProgramSections(draft.institutional, draft) && draft.institutional.every(isInstitutionalProgramValid);
  }
  if (segmentId === "admissions") {
    return hasProgramSections(draft.admissions, draft) && draft.admissions.every(isAdmissionsProgramValid);
  }
  if (segmentId === "training-completion") {
    return hasProgramSections(draft.completions, draft) && draft.completions.every(isCompletionProgramValid);
  }
  if (segmentId === "reason-for-non-completion") {
    return hasProgramSections(draft.nonCompletions, draft) && draft.nonCompletions.every(isNonCompletionProgramValid);
  }
  if (segmentId === "employment-type") {
    return hasProgramSections(draft.employmentType, draft) && draft.employmentType.every(isEmploymentTypeValid);
  }
  if (segmentId === "earn-and-learn") {
    return hasProgramSections(draft.earnAndLearn, draft) && draft.earnAndLearn.every(isEarnAndLearnValid);
  }
  if (segmentId === "salaries-of-participants") {
    return hasProgramSections(draft.salaries, draft) && draft.salaries.every(isSalariesValid);
  }
  if (segmentId === "employment-status-6-months") {
    return hasProgramSections(draft.employmentStatus, draft) && draft.employmentStatus.every(isEmploymentStatusValid);
  }
  return false;
}

export function isEdaProgramSectionValid(segmentId: EdaSegmentId, item: unknown): boolean {
  if (segmentId === "institutional-information") return isInstitutionalProgramValid(item as InstitutionalProgram);
  if (segmentId === "admissions") return isAdmissionsProgramValid(item as AdmissionsProgram);
  if (segmentId === "training-completion") return isCompletionProgramValid(item as CompletionProgram);
  if (segmentId === "reason-for-non-completion") return isNonCompletionProgramValid(item as NonCompletionProgram);
  if (segmentId === "employment-type") return isEmploymentTypeValid(item as EmploymentTypeProgram);
  if (segmentId === "earn-and-learn") return isEarnAndLearnValid(item as EarnAndLearnProgram);
  if (segmentId === "salaries-of-participants") return isSalariesValid(item as SalariesProgram);
  if (segmentId === "employment-status-6-months") return isEmploymentStatusValid(item as EmploymentStatusProgram);
  if (segmentId === "participant-database") return isParticipantValid(item as EdaParticipant);
  return true;
}

function participantHasStarted(person: EdaParticipant): boolean {
  return Boolean(
    hasText(person.firstName) ||
      hasText(person.lastName) ||
      hasText(person.street) ||
      isSplitDateComplete(person.trainingStart) ||
      isSplitDateComplete(person.trainingEnd),
  );
}

function programSectionHasStarted(draft: EdaSurveyDraft): boolean {
  return (
    draft.institutional.some((item) => item.programHours.length > 0 || hasText(item.programLength) || hasText(item.tuitionCost)) ||
    draft.completions.some((item) => item.skipNoCompletions || Number(item.completed) > 0) ||
    draft.nonCompletions.some((item) => item.skipReasons || Number(item.didNotComplete) > 0) ||
    draft.admissions.some((item) => Number(item.recruited) > 0 || Number(item.admitted) > 0 || Number(item.enrolled) > 0) ||
    draft.employmentType.some((item) => item.skipNoPlacements || Number(item.types.fullTime) > 0) ||
    draft.earnAndLearn.some((item) => item.skipNoModels || hasText(item.workBasedLearning)) ||
    draft.salaries.some((item) => item.skipNoSalaries || hasText(item.reportedPercent)) ||
    draft.employmentStatus.some((item) => item.skipNoStatus || hasText(item.topOccupations))
  );
}

function edaHasStarted(draft: EdaSurveyDraft): boolean {
  if (hasText(draft.sectoralPartnership)) return true;
  if (filledPrograms(draft.trainingPrograms).length > 0) return true;
  if (draft.noParticipants || draft.participants.some(participantHasStarted)) return true;
  return programSectionHasStarted(draft);
}

export function edaFillState(draft: EdaSurveyDraft): DocumentFillState {
  const allValid = EDA_SEGMENTS.every((segment) => isEdaSegmentValid(segment.id, draft));
  if (allValid) return "filled";
  if (edaHasStarted(draft) || hasText(draft.trainingProvider)) return "Incomplete";
  return "blank";
}

export function invoiceFillState(draft: InvoiceDraft): DocumentFillState {
  const numberOk = hasText(draft.invoiceNumber);
  const amountOk = isNonNegativeNumber(draft.amount);
  if (numberOk && amountOk) return "filled";
  if (numberOk || amountOk || hasText(draft.notes)) return "Incomplete";
  return "blank";
}

export function isInvoiceValid(draft: InvoiceDraft): boolean {
  return invoiceFillState(draft) === "filled";
}

export function documentList(record: PeriodSubmissionRecord): SubmissionDocument[] {
  return [
    { kind: "eda-survey", label: "EDA Survey", state: edaFillState(record.eda) },
    { kind: "technical-report", label: "Technical report", state: technicalFillState(record.technical) },
    { kind: "invoice", label: "Invoice", state: invoiceFillState(record.invoice) },
  ];
}

export function canSubmitMonthlyPackage(record: PeriodSubmissionRecord): boolean {
  return technicalFillState(record.technical) === "filled" && edaFillState(record.eda) === "filled";
}

export function displayDocumentState(state: DocumentFillState): string {
  if (state === "filled") return "filled";
  if (state === "Incomplete") return "Incomplete";
  return "blank";
}

export function participantSummary(person: EdaParticipant): string {
  const name = [person.firstName, person.middleName, person.lastName].filter(Boolean).join(" ") || "Unnamed participant";
  const dates = [formatSplitDate(person.trainingStart), formatSplitDate(person.trainingEnd)].filter(Boolean).join(" – ");
  return [name, person.trainingProgram, dates].filter(Boolean).join(" · ");
}
