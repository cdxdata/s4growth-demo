import type { DocumentFillState } from "@/types/submissions";
import { displayDocumentState } from "@/lib/submissionDocuments";

const TONE: Record<DocumentFillState, string> = {
  filled: "success",
  Incomplete: "queue",
  blank: "idle",
};

export function DocumentStatusBadge({ state }: { state: DocumentFillState }) {
  if (state === "blank") {
    return <span className="status-idle">{displayDocumentState(state)}</span>;
  }

  return <span className={`status-badge ${TONE[state]}`}>{displayDocumentState(state)}</span>;
}
