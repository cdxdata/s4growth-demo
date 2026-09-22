import { EDA_SEGMENTS, type EdaSegmentId } from "@/constants/eda";
import type { IntakeDraft } from "@/types/domain";
import type {
  DocumentFillState,
  EdaSurveyDraft,
  InvoiceDraft,
  PeriodSubmissionRecord,
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
  const required = [draft.achievements, draft.challenges, draft.plan];
  const filledCount = required.filter(hasText).length;
  if (filledCount === required.length) return "filled";
  if (filledCount > 0 || hasText(draft.story)) return "Incomplete";
  return "blank";
}

export function isTechnicalValid(draft: IntakeDraft): boolean {
  return technicalFillState(draft) === "filled";
}

export function isTrainingProviderSegmentValid(draft: EdaSurveyDraft): boolean {
  return hasText(draft.sectoralPartnership) && hasText(draft.trainingProvider) && filledPrograms(draft.trainingPrograms).length >= 1;
}

function isNonCompletionValid(draft: EdaSurveyDraft): boolean {
  if (!isNonNegativeNumber(draft.nonCompletions)) return false;
  if (Number(draft.nonCompletions) > 0 && !hasText(draft.primaryReason)) return false;
  return true;
}

export function isEdaSegmentValid(segmentId: EdaSegmentId, draft: EdaSurveyDraft): boolean {
  if (segmentId === "training-provider") return isTrainingProviderSegmentValid(draft);
  if (segmentId === "reason-for-non-completion") return isNonCompletionValid(draft);

  const segment = EDA_SEGMENTS.find((item) => item.id === segmentId);
  if (!segment) return false;
  return segment.fields.every((field) => {
    if (!field.required) return true;
    const value = draft[field.key];
    return field.type === "number" ? isNonNegativeNumber(value) : hasText(value);
  });
}

function edaHasStarted(draft: EdaSurveyDraft): boolean {
  if (hasText(draft.sectoralPartnership)) return true;
  if (filledPrograms(draft.trainingPrograms).length > 0) return true;
  return EDA_SEGMENTS.some((segment) =>
    segment.fields.some((field) => {
      if (field.key === "trainingProvider") return false;
      return hasText(draft[field.key]);
    }),
  );
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
    { kind: "technical-report", label: "Technical report", state: technicalFillState(record.technical) },
    { kind: "eda-survey", label: "EDA Survey", state: edaFillState(record.eda) },
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
