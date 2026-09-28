import { useEffect, useState } from "react";
import { FieldMarks } from "@/components/ui/FieldMarks";
import { Panel } from "@/components/ui/Panel";
import type { EdaSegmentId } from "@/constants/eda";
import type { EdaReviewSection } from "@/lib/edaReviewSections";
import type { FieldMark, FormReviewState, FormScore, ReviewAttachment, ReviewField } from "@/types/submissions";

type FileKind = "pdf" | "image" | "text" | "word" | "other";

function fileExtension(file: ReviewAttachment): string {
  const source = `${file.name} ${file.downloadName ?? ""}`;
  const match = source.match(/\.([A-Za-z0-9]{1,8})(?:\s|$)/);
  if (match) return match[1].toUpperCase();
  if (file.type?.includes("pdf")) return "PDF";
  if (file.type?.startsWith("image/")) return (file.type.split("/")[1] ?? "IMG").toUpperCase();
  if (file.type?.includes("word") || file.type?.includes("msword")) return "DOC";
  if (file.type?.includes("text")) return "TXT";
  return "FILE";
}

function fileKind(file: ReviewAttachment): FileKind {
  const ext = fileExtension(file).toLowerCase();
  const type = (file.type ?? "").toLowerCase();
  if (type.startsWith("image/") || /^(png|jpe?g|gif|webp|svg)$/.test(ext)) return "image";
  if (type.includes("pdf") || ext === "pdf") return "pdf";
  if (type.startsWith("text/") || ext === "txt") return "text";
  if (type.includes("word") || type.includes("msword") || ext === "doc" || ext === "docx") return "word";
  return "other";
}

function textFromDataUrl(href: string): string | null {
  if (!href.startsWith("data:text/")) return null;
  const comma = href.indexOf(",");
  if (comma < 0) return null;
  const meta = href.slice(5, comma);
  const payload = href.slice(comma + 1);
  try {
    return meta.includes("base64") ? atob(payload) : decodeURIComponent(payload);
  } catch {
    return null;
  }
}

function previewCopy(file: ReviewAttachment): string {
  const kind = fileKind(file);
  if (kind === "text") return textFromDataUrl(file.href) ?? `Demo attachment: ${file.name}`;
  if (kind === "word") return `Preview of ${file.name}`;
  if (kind === "pdf") return `Demo attachment: ${file.name}`;
  return `Preview of ${file.name}`;
}

function FileTypeIcon({ kind, ext, large }: { kind: FileKind; ext: string; large?: boolean }) {
  return (
    <span className={`file-type-icon is-${kind}${large ? " is-large" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 32 40" width="22" height="28">
        <path d="M4 0h16l8 8v32H4z" />
        <path d="M20 0v8h8" />
      </svg>
      <em>{ext}</em>
    </span>
  );
}

export function ReviewAttachments({ attachments }: { attachments?: ReviewAttachment[] }) {
  const [viewing, setViewing] = useState<ReviewAttachment | null>(null);

  useEffect(() => {
    if (!viewing) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setViewing(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewing]);

  if (!attachments?.length) return null;

  const viewingKind = viewing ? fileKind(viewing) : null;

  return (
    <>
      <ul className="review-attachments">
        {attachments.map((file) => {
          const kind = fileKind(file);
          const ext = fileExtension(file);
          return (
            <li key={file.name}>
              <button type="button" className="review-attachment-view" onClick={() => setViewing(file)}>
                <FileTypeIcon kind={kind} ext={ext} />
                <span className="review-attachment-copy">
                  <b>View file</b>
                  <span>{file.name}</span>
                </span>
              </button>
              <a className="review-attachment-download" href={file.href} download={file.downloadName}>
                Download
              </a>
              {file.sizeLabel ? <span>{file.sizeLabel}</span> : null}
            </li>
          );
        })}
      </ul>
      {viewing && viewingKind ? (
        <div className="review-attachment-modal" role="dialog" aria-modal="true" aria-label={`View ${viewing.name}`}>
          <button type="button" className="review-attachment-backdrop" aria-label="Close attachment" onClick={() => setViewing(null)} />
          <div className="review-attachment-dialog">
            <div className="review-attachment-dialog-head">
              <strong>{viewing.name}</strong>
              <div className="review-attachment-dialog-actions">
                <a className="btn secondary" href={viewing.href} download={viewing.downloadName}>
                  Download
                </a>
                <button type="button" className="btn primary" onClick={() => setViewing(null)}>
                  Close
                </button>
              </div>
            </div>
            <div className="review-attachment-preview">
              {viewingKind === "image" ? (
                <img src={viewing.href} alt={viewing.name} />
              ) : viewingKind === "text" ? (
                <pre className="review-attachment-text">{previewCopy(viewing)}</pre>
              ) : (
                <div className="review-attachment-sheet">
                  <FileTypeIcon kind={viewingKind} ext={fileExtension(viewing)} large />
                  <h3>{viewing.name}</h3>
                  <p>{previewCopy(viewing)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function ReviewFieldList({
  fields,
  fieldMarks,
  showMarks,
  changedFieldIds,
  interactive,
  onMark,
}: {
  fields: ReviewField[];
  fieldMarks?: Record<string, FieldMark>;
  showMarks?: boolean;
  changedFieldIds?: string[];
  interactive?: boolean;
  onMark?: (fieldId: string, mark: FieldMark) => void;
}) {
  const changed = new Set(changedFieldIds ?? []);
  return (
    <dl className="eda-review-grid">
      {fields.map((field) => {
        const updated = changed.has(field.id);
        return (
        <div key={field.id} className={`review-field${updated ? " is-updated" : ""}`}>
          <dt>
            <span>
              {field.label}
              {updated ? <em className="review-updated-tag">Updated</em> : null}
            </span>
            {showMarks || updated ? (
              <FieldMarks
                mark={fieldMarks?.[field.id]}
                interactive={interactive}
                onChange={(mark) => onMark?.(field.id, mark)}
              />
            ) : null}
          </dt>
          <dd>
            {field.link ? (
              <a href={field.link} target="_blank" rel="noreferrer">
                {field.value}
              </a>
            ) : (
              field.value
            )}
            <ReviewAttachments attachments={field.attachments} />
          </dd>
        </div>
        );
      })}
    </dl>
  );
}

export function ScoreToggle({
  score,
  onChange,
}: {
  score: FormScore | null;
  onChange: (score: FormScore) => void;
}) {
  return (
    <div className="score-toggle">
      <button type="button" className={`score-btn pass${score === "Passed" ? " is-on" : ""}`} onClick={() => onChange("Passed")}>
        Passed
      </button>
      <button type="button" className={`score-btn flag${score === "Flagged" ? " is-on" : ""}`} onClick={() => onChange("Flagged")}>
        Flagged
      </button>
    </div>
  );
}

export function EdaReviewSections({
  sections,
  fieldMarks,
  showMarks,
  changedFieldIds,
  sectionReviews,
  interactive,
  onMark,
  onScore,
  onEdit,
}: {
  sections: EdaReviewSection[];
  fieldMarks?: Record<string, FieldMark>;
  showMarks?: boolean;
  changedFieldIds?: string[];
  sectionReviews?: Record<string, FormReviewState>;
  interactive?: boolean;
  onMark?: (fieldId: string, mark: FieldMark) => void;
  onScore?: (id: EdaSegmentId, score: FormScore) => void;
  onEdit?: (id: EdaSegmentId) => void;
}) {
  const changed = new Set(changedFieldIds ?? []);
  return (
    <>
      {sections.map((section) => {
        const review = sectionReviews?.[section.id];
        const flagged = review ? review.score === "Flagged" : Boolean(showMarks);
        const marks = review?.fieldMarks ?? fieldMarks;
        return (
          <Panel key={section.id} className="eda-review-card">
            <div className="eda-review-head">
              <h2>{section.title}</h2>
              <div className="eda-review-head-actions">
                {onScore ? <ScoreToggle score={review?.score ?? null} onChange={(score) => onScore(section.id, score)} /> : null}
                {onEdit ? (
                  <button type="button" className="btn secondary" onClick={() => onEdit(section.id)}>
                    Edit
                  </button>
                ) : null}
              </div>
            </div>
            <dl className="eda-review-grid">
              {section.rows.map((row, index) => {
                const heading = Boolean(row.heading || row.value === "Program section");
                const updated = Boolean(row.fieldId && changed.has(row.fieldId));
                return (
                  <div
                    key={`${section.id}-${index}-${row.label}`}
                    className={[heading ? "eda-review-program" : undefined, updated ? "is-updated" : undefined].filter(Boolean).join(" ")}
                  >
                    <dt>
                      <span>
                        {row.label}
                        {updated ? <em className="review-updated-tag">Updated</em> : null}
                      </span>
                      {(flagged || updated) && row.fieldId ? (
                        <FieldMarks
                          mark={marks?.[row.fieldId]}
                          interactive={interactive}
                          onChange={(mark) => onMark?.(row.fieldId as string, mark)}
                        />
                      ) : null}
                    </dt>
                    <dd>{heading && row.value === "Program section" ? "" : row.value}</dd>
                  </div>
                );
              })}
            </dl>
          </Panel>
        );
      })}
    </>
  );
}
