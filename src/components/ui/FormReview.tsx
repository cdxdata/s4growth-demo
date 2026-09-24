import { FieldMarks } from "@/components/ui/FieldMarks";
import { Panel } from "@/components/ui/Panel";
import type { EdaSegmentId } from "@/constants/eda";
import type { EdaReviewSection } from "@/lib/edaReviewSections";
import type { FieldMark, FormReviewState, FormScore, ReviewAttachment, ReviewField } from "@/types/submissions";

export function ReviewAttachments({ attachments }: { attachments?: ReviewAttachment[] }) {
  if (!attachments?.length) return null;
  return (
    <ul className="review-attachments">
      {attachments.map((file) => (
        <li key={file.name}>
          <a href={file.href} download={file.name}>
            Download {file.name}
          </a>
          {file.sizeLabel ? <span>{file.sizeLabel}</span> : null}
        </li>
      ))}
    </ul>
  );
}

export function ReviewFieldList({
  fields,
  fieldMarks,
  showMarks,
  interactive,
  onMark,
}: {
  fields: ReviewField[];
  fieldMarks?: Record<string, FieldMark>;
  showMarks?: boolean;
  interactive?: boolean;
  onMark?: (fieldId: string, mark: FieldMark) => void;
}) {
  return (
    <dl className="eda-review-grid">
      {fields.map((field) => (
        <div key={field.id} className="review-field">
          <dt>
            <span>{field.label}</span>
            {showMarks ? (
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
      ))}
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
  sectionReviews,
  interactive,
  onMark,
  onScore,
  onEdit,
}: {
  sections: EdaReviewSection[];
  fieldMarks?: Record<string, FieldMark>;
  showMarks?: boolean;
  sectionReviews?: Record<string, FormReviewState>;
  interactive?: boolean;
  onMark?: (fieldId: string, mark: FieldMark) => void;
  onScore?: (id: EdaSegmentId, score: FormScore) => void;
  onEdit?: (id: EdaSegmentId) => void;
}) {
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
                return (
                  <div key={`${section.id}-${index}-${row.label}`} className={heading ? "eda-review-program" : undefined}>
                    <dt>
                      <span>{row.label}</span>
                      {flagged && row.fieldId ? (
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
