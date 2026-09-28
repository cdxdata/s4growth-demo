import { EdaReviewSections, ReviewFieldList, ScoreToggle } from "@/components/ui/FormReview";
import { Panel } from "@/components/ui/Panel";
import { useProviderMonthly } from "@/features/providers/useProviderMonthly";

export function ProviderMonthlyReview() {
  const summary = useProviderMonthly();

  return (
    <div className="manager-review">
      <div className="manager-review-lead">
        <div>
          <div className="eyebrow">Monthly packet</div>
          <h2>{summary.monthLabel}</h2>
          <p>Read-only copies of the training provider’s submitted forms. Score each form, then save or finish.</p>
        </div>
        <span className="eda-step-count">
          {summary.scored} of {summary.total} forms scored
        </span>
      </div>

      {summary.forms.map((form) => (
        <div key={form.id} className="manager-review-pack">
          <div className="manager-review-head">
            <h2>{form.label}</h2>
            {form.id === "eda-survey" ? null : <ScoreToggle score={form.score} onChange={(score) => summary.setScore(form.id, score)} />}
          </div>
          {form.id === "eda-survey" ? (
            <EdaReviewSections
              sections={form.sections}
              sectionReviews={form.sectionReviews}
              changedFieldIds={summary.changedFieldIds}
              interactive
              onScore={summary.setEdaScore}
              onMark={(fieldId, mark) => summary.setMark(form.id, fieldId, mark)}
            />
          ) : (
            <Panel className="eda-review-card manager-review-card">
              <ReviewFieldList
                fields={form.fields}
                fieldMarks={form.fieldMarks}
                showMarks={form.score === "Flagged"}
                changedFieldIds={summary.changedFieldIds}
                interactive
                onMark={(fieldId, mark) => summary.setMark(form.id, fieldId, mark)}
              />
            </Panel>
          )}
        </div>
      ))}

      {summary.lastMail ? (
        <Panel className="manager-review-mail">
          <div className="eyebrow">Last notification</div>
          <div className="message">
            <div className="subject">{summary.lastMail.subject}</div>
            <p>{summary.lastMail.body}</p>
            <span className="helper">Sent to {summary.lastMail.recipients.join(", ")}</span>
          </div>
        </Panel>
      ) : null}

      <div className="form-foot eda-review-foot manager-review-foot">
        <button type="button" className="btn secondary" onClick={summary.goBack}>
          Go back
        </button>
        <div className="manager-review-action">
          {summary.allMarked ? (
            <button type="button" className="btn primary" disabled={!summary.canFinish} onClick={summary.finish}>
              Save and notify
            </button>
          ) : (
            <button type="button" className="btn primary" onClick={summary.saveLater}>
              Save and finish later
            </button>
          )}
          <p>An email will be sent to the training provider and reporting contacts.</p>
        </div>
      </div>
    </div>
  );
}
