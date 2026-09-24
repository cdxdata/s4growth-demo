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
          <strong>{summary.lastMail.subject}</strong>
          <pre>{summary.lastMail.body}</pre>
          <span className="helper">Sent to {summary.lastMail.recipients.join(", ")}</span>
        </Panel>
      ) : null}

      <div className="form-foot eda-review-foot">
        <button type="button" className="btn secondary" onClick={summary.saveLater}>
          Save and finish later
        </button>
        <button type="button" className="btn primary" disabled={!summary.canFinish} onClick={summary.finish}>
          Done
        </button>
      </div>
    </div>
  );
}
