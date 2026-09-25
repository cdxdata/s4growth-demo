import { documentList } from "@/lib/submissionDocuments";
import { normalizeEdaReview } from "@/lib/reviewModel";
import type { SubmissionStatus } from "@/types/domain";
import type { DocumentFillState, FormScore, PeriodSubmissionRecord } from "@/types/submissions";

export type OverviewDocumentTone = "complete" | "review" | "flagged" | "incomplete" | "idle";

export type OverviewDocument = {
  id: string;
  label: string;
  text: string;
  tone: OverviewDocumentTone;
};

function formScore(record: PeriodSubmissionRecord, kind: OverviewDocument["id"]): FormScore | null {
  if (kind === "eda-survey") return normalizeEdaReview(record.review["eda-survey"]).score;
  if (kind === "technical-report") return record.review["technical-report"].score;
  return record.review.invoice.score;
}

function toneFor(
  state: DocumentFillState,
  score: FormScore | null,
  submissionStatus: SubmissionStatus,
): OverviewDocumentTone {
  if (score === "Flagged") return "flagged";
  if (state === "filled") {
    if (submissionStatus === "Missing/flagged") return "flagged";
    if (submissionStatus === "Complete" || score === "Passed") return "complete";
    if (submissionStatus === "In review" || submissionStatus === "Awaiting review") return "review";
    return "complete";
  }
  if (state === "Incomplete") return "incomplete";
  return "idle";
}

function textFor(state: DocumentFillState, score: FormScore | null, submissionStatus: SubmissionStatus): string {
  if (score === "Flagged") return "Flagged in review";
  if (state === "filled") {
    if (score === "Passed" || submissionStatus === "Complete") return "Submitted";
    if (submissionStatus === "In review") return "Submitted · in review";
    if (submissionStatus === "Awaiting review") return "Submitted · awaiting review";
    return "Submitted";
  }
  if (state === "Incomplete") return "Started, not finished";
  return "Not submitted";
}

export function overviewDocuments(record: PeriodSubmissionRecord, submissionStatus: SubmissionStatus): OverviewDocument[] {
  return documentList(record).map((document) => {
    const score = formScore(record, document.kind);
    return {
      id: document.kind,
      label: document.label,
      text: textFor(document.state, score, submissionStatus),
      tone: toneFor(document.state, score, submissionStatus),
    };
  });
}
