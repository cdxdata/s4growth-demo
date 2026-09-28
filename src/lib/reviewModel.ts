import { EDA_SEGMENT_IDS, EDA_SEGMENTS, isEdaSegmentId, type EdaSegmentId } from "@/constants/eda";
import { MONTH_NAMES, getPeriodById, getPeriodDueIso } from "@/constants/periods";
import { edaReviewSections } from "@/lib/edaReviewSections";
import { asOfDateForPeriod, formatTimelineStatus } from "@/lib/reportingDates";
import { attachmentDownloadName, attachmentHref, formatFileSize, technicalNarratives } from "@/lib/technicalReport";
import type { IntakeDraft, SubmissionStatus, TestimonialFile } from "@/types/domain";
import type {
  EdaFormReviewState,
  EdaSurveyDraft,
  FieldMark,
  FormReviewState,
  FormScore,
  InvoiceDraft,
  PackageReview,
  PeriodSubmissionRecord,
  ReviewField,
  ReviewFormId,
  SubmissionDocumentKind,
} from "@/types/submissions";

export const SYSTEM_LEAD = "NC A&T";
export const REVIEW_FORMS: ReviewFormId[] = ["technical-report", "eda-survey", "invoice"];

export function emptyFormReview(): FormReviewState {
  return { score: null, fieldMarks: {} };
}

export function emptyEdaSections(): Record<EdaSegmentId, FormReviewState> {
  return Object.fromEntries(EDA_SEGMENT_IDS.map((id) => [id, emptyFormReview()])) as Record<EdaSegmentId, FormReviewState>;
}

export function deriveEdaScore(sections: Record<string, FormReviewState>): FormReviewState["score"] {
  const scores = EDA_SEGMENT_IDS.map((id) => sections[id]?.score ?? null);
  if (scores.some((score) => !score)) return null;
  if (scores.some((score) => score === "Flagged")) return "Flagged";
  return "Passed";
}

export function edaSectionFromFieldId(fieldId: string): EdaSegmentId | null {
  const sectionId = fieldId.split(".")[1];
  return isEdaSegmentId(sectionId) ? sectionId : null;
}

export function mergeEdaFieldMarks(sections: Record<string, FormReviewState>): Record<string, "good" | "bad"> {
  return Object.assign({}, ...EDA_SEGMENT_IDS.map((id) => sections[id]?.fieldMarks ?? {}));
}

export function normalizeEdaReview(review?: Partial<EdaFormReviewState> | FormReviewState | null): EdaFormReviewState {
  const sections = emptyEdaSections();
  const incoming = review && "sections" in review ? review.sections : undefined;
  if (incoming) {
    for (const id of EDA_SEGMENT_IDS) {
      sections[id] = {
        score: incoming[id]?.score ?? null,
        fieldMarks: { ...(incoming[id]?.fieldMarks ?? {}) },
      };
    }
  }
  for (const [fieldId, mark] of Object.entries(review?.fieldMarks ?? {})) {
    const id = edaSectionFromFieldId(fieldId);
    if (id && !sections[id].fieldMarks[fieldId]) sections[id].fieldMarks[fieldId] = mark;
  }
  return {
    score: deriveEdaScore(sections),
    fieldMarks: mergeEdaFieldMarks(sections),
    sections,
  };
}

export function emptyEdaFormReview(): EdaFormReviewState {
  return normalizeEdaReview();
}

export function emptyPackageReview(): PackageReview {
  return {
    "technical-report": emptyFormReview(),
    "eda-survey": emptyEdaFormReview(),
    invoice: emptyFormReview(),
  };
}

export function normalizePackageReview(review?: Partial<PackageReview> | null): PackageReview {
  return {
    "technical-report": { ...emptyFormReview(), ...review?.["technical-report"], fieldMarks: { ...(review?.["technical-report"]?.fieldMarks ?? {}) } },
    invoice: { ...emptyFormReview(), ...review?.invoice, fieldMarks: { ...(review?.invoice?.fieldMarks ?? {}) } },
    "eda-survey": normalizeEdaReview(review?.["eda-survey"]),
  };
}

export const REVIEW_UNIT_TOTAL = 2 + EDA_SEGMENT_IDS.length;

export function reviewScoreables(review: PackageReview): FormReviewState[] {
  const eda = normalizeEdaReview(review["eda-survey"]);
  return [review["technical-report"], review.invoice, ...EDA_SEGMENT_IDS.map((id) => eda.sections[id])];
}

export function formLabel(id: ReviewFormId): string {
  if (id === "technical-report") return "Technical report";
  if (id === "eda-survey") return "EDA Survey";
  return "Invoice";
}

function line(value: string): string {
  return value.trim() || "—";
}

function asLink(value: string): string | undefined {
  return /^https?:\/\//i.test(value.trim()) ? value.trim() : undefined;
}

function testimonialFiles(draft: IntakeDraft): TestimonialFile[] {
  return draft.testimonial.files.filter((file): file is TestimonialFile => Boolean(file?.name));
}

export type ReviewFieldContext = {
  month: string;
  providerName: string;
};

export function technicalReviewFields(draft: IntakeDraft, context?: ReviewFieldContext): ReviewField[] {
  const story = technicalNarratives(draft);
  const files = testimonialFiles(draft);
  const media = draft.mediaLink.available === "None" ? "None" : draft.mediaLink.detail;
  const month = context?.month ?? "Month";
  const providerName = context?.providerName || "Training provider";
  return [
    { id: "technical.challenges", label: "Challenges this month", value: line(story.challenges) },
    { id: "technical.plans", label: "Plan to address the challenges listed in 02", value: line(story.plan) },
    { id: "technical.achievements", label: "This month's achievement", value: line(story.achievements) },
    {
      id: "technical.testimonial",
      label: "Participant testimonial",
      value: draft.testimonial.available === "None" ? "None" : files.length ? `${files.length} attachment${files.length === 1 ? "" : "s"}` : "Yes",
      attachments: files.map((file, index) => ({
        name: file.name,
        href: attachmentHref(file),
        downloadName: attachmentDownloadName(month, providerName, file.name, index, files.length),
        type: file.type,
        sizeLabel: formatFileSize(file.size),
      })),
    },
    {
      id: "technical.mediaLink",
      label: "Photo/video/article link",
      value: line(media),
      link: asLink(media),
    },
  ];
}

export function invoiceReviewFields(draft: InvoiceDraft): ReviewField[] {
  return [
    { id: "invoice.invoiceNumber", label: "Invoice number", value: line(draft.invoiceNumber) },
    { id: "invoice.amount", label: "Amount (USD)", value: draft.amount.trim() ? `$${draft.amount}` : "—" },
    { id: "invoice.notes", label: "Notes", value: line(draft.notes) },
  ];
}

export function edaReviewFields(draft: EdaSurveyDraft): ReviewField[] {
  return edaReviewSections(draft).flatMap((section) =>
    section.rows
      .filter((row) => row.fieldId)
      .map((row) => ({
        id: row.fieldId as string,
        label: row.label,
        value: row.value,
        sectionId: section.id,
        sectionTitle: section.title,
      })),
  );
}

export function reviewSignature(review: PackageReview): string {
  const eda = normalizeEdaReview(review["eda-survey"]);
  return JSON.stringify({
    "technical-report": { score: review["technical-report"].score, fieldMarks: review["technical-report"].fieldMarks },
    invoice: { score: review.invoice.score, fieldMarks: review.invoice.fieldMarks },
    eda: EDA_SEGMENT_IDS.map((id) => ({ id, score: eda.sections[id].score, fieldMarks: eda.sections[id].fieldMarks })),
  });
}

export function fieldsForForm(kind: ReviewFormId, record: PeriodSubmissionRecord, context?: ReviewFieldContext): ReviewField[] {
  const providerName = context?.providerName || record.eda.trainingProvider || "Training provider";
  if (kind === "technical-report") return technicalReviewFields(record.technical, { month: context?.month ?? "Month", providerName });
  if (kind === "invoice") return invoiceReviewFields(record.invoice);
  return edaReviewFields(record.eda);
}

export function scoredFormCount(review: PackageReview): number {
  return reviewScoreables(review).filter((item) => item.score).length;
}

export function passIfAllFieldsGood(
  score: FormScore | null,
  fields: ReviewField[],
  marks: Record<string, FieldMark>,
): { score: FormScore | null; fieldMarks: Record<string, FieldMark> } {
  if (score !== "Flagged") return { score, fieldMarks: marks };
  const markable = fields.filter((field) => field.id);
  if (!markable.length || markable.some((field) => marks[field.id] !== "good")) {
    return { score, fieldMarks: marks };
  }
  return { score: "Passed", fieldMarks: {} };
}

export function statusAfterSaveLater(review: PackageReview): SubmissionStatus | null {
  const scored = scoredFormCount(review);
  if (scored === 0) return null;
  return "In review";
}

export function statusAfterDone(review: PackageReview): SubmissionStatus | null {
  if (scoredFormCount(review) < REVIEW_UNIT_TOTAL) return null;
  if (reviewScoreables(review).some((item) => item.score === "Flagged")) return "Missing/flagged";
  return "Complete";
}

export function flaggedAreas(record: PeriodSubmissionRecord): string[] {
  const areas: string[] = [];
  const review = normalizePackageReview(record.review);
  for (const id of ["technical-report", "invoice"] as const) {
    const form = review[id];
    if (form.score !== "Flagged") continue;
    const fields = fieldsForForm(id, record);
    const bad = fields.filter((field) => form.fieldMarks[field.id] === "bad");
    if (bad.length) {
      for (const field of bad) areas.push(`${formLabel(id)} - ${field.label}`);
    } else {
      areas.push(formLabel(id));
    }
  }
  for (const segment of EDA_SEGMENTS) {
    if (review["eda-survey"].sections[segment.id]?.score === "Flagged") {
      areas.push(`${formLabel("eda-survey")} - ${segment.title}`);
    }
  }
  return areas;
}

export function emailSubjectForStatus(status: SubmissionStatus, month: string): string {
  if (status === "Missing/flagged") return `Action needed: ${month} Steps4Growth report`;
  if (status === "Not started") return `Not Started: ${month} Steps4Growth report`;
  return `${status}: ${month} Steps4Growth report`;
}

export function buildReviewEmailBody(input: {
  toName: string;
  dueDate: string;
  timelineStatus: string;
  paragraph: string;
}): string {
  return [
    `Hello ${input.toName},`,
    "",
    input.paragraph,
    "",
    `Current due date: ${input.dueDate}`,
    `Status: ${input.timelineStatus}`,
  ].join("\n");
}

export function buildStatusEmail(input: {
  providerName: string;
  periodId: string;
  status: SubmissionStatus;
  record: PeriodSubmissionRecord;
}): { subject: string; body: string } {
  const period = getPeriodById(input.periodId);
  const month = MONTH_NAMES[(period.month ?? 9) - 1];
  const dueOn = getPeriodDueIso(period);
  const due = period.dueDateLong ?? `${month} 17, ${period.year}`;
  const timeline = formatTimelineStatus(null, dueOn, asOfDateForPeriod(dueOn));

  return {
    subject: emailSubjectForStatus(input.status, month),
    body: buildReviewEmailBody({
      toName: input.providerName,
      dueDate: due,
      timelineStatus: timeline,
      paragraph: `Your ${month} submission status is marked ${input.status}.`,
    }),
  };
}

export function documentKindToForm(kind: SubmissionDocumentKind): ReviewFormId {
  return kind;
}

function fieldValueKey(field: ReviewField): string {
  const files = (field.attachments ?? []).map((file) => `${file.name}:${file.sizeLabel ?? ""}:${file.href ?? ""}`).join(",");
  return `${field.value}\n${files}`;
}

export function reviewValueSnapshot(record: PeriodSubmissionRecord): Record<string, string> {
  const values: Record<string, string> = {};
  for (const formId of REVIEW_FORMS) {
    for (const field of fieldsForForm(formId, record)) {
      values[field.id] = fieldValueKey(field);
    }
  }
  return values;
}

export function changedReviewFieldIds(record: PeriodSubmissionRecord): string[] {
  const snapshot = record.reviewFieldSnapshot;
  if (!snapshot) return [];
  const current = reviewValueSnapshot(record);
  const ids = new Set([...Object.keys(current), ...Object.keys(snapshot)]);
  return [...ids].filter((id) => current[id] !== snapshot[id]);
}

export function unmarkChangedFields(review: PackageReview, changedIds: string[]): PackageReview {
  if (!changedIds.length) return review;
  const next = normalizePackageReview(review);
  let cleared = false;
  for (const id of changedIds) {
    if (next["technical-report"].fieldMarks[id]) {
      delete next["technical-report"].fieldMarks[id];
      cleared = true;
    }
    if (next.invoice.fieldMarks[id]) {
      delete next.invoice.fieldMarks[id];
      cleared = true;
    }
    const sectionId = edaSectionFromFieldId(id);
    if (sectionId && next["eda-survey"].sections[sectionId]?.fieldMarks[id]) {
      delete next["eda-survey"].sections[sectionId].fieldMarks[id];
      cleared = true;
    }
  }
  if (!cleared) return review;
  next["eda-survey"] = {
    ...next["eda-survey"],
    fieldMarks: mergeEdaFieldMarks(next["eda-survey"].sections),
    score: deriveEdaScore(next["eda-survey"].sections),
  };
  return next;
}
