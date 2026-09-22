import { Header } from "@/components/layout/Header";
import { Panel } from "@/components/ui/Panel";
import { useEdaReview } from "@/features/submissions/useEdaReview";

export function EdaReviewPage() {
  const summary = useEdaReview();

  return (
    <>
      <Header title="Review EDA Survey" subtitle={`${summary.monthLabel} Monthly Submission · ${summary.organizationName}`} />
      <div className="form-wrap eda-wrap">
        <button type="button" className="back" onClick={summary.goBack}>
          ← Monthly Submissions
        </button>
        <div className="eda-form-title">
          <div>
            <div className="eyebrow">Review</div>
            <h2>EDA Survey</h2>
          </div>
        </div>
        <p className="eda-review-lead">
          Check each section before you submit. You can edit a page without losing the rest of the form.
        </p>
        {summary.sections.map((section) => (
          <Panel key={section.id} className="eda-review-card">
            <div className="eda-review-head">
              <h2>{section.title}</h2>
              <button type="button" className="btn secondary" onClick={() => summary.editSection(section.id)}>
                Edit
              </button>
            </div>
            <dl className="eda-review-grid">
              {section.rows.map((row) => (
                <div key={`${section.id}-${row.label}`}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        ))}
        <div className="form-foot eda-review-foot">
          <button type="button" className="btn secondary" onClick={summary.goBack}>
            Save Submission
          </button>
          <button type="button" className="btn primary" disabled={!summary.canSubmit} onClick={summary.submit}>
            Submit
          </button>
        </div>
      </div>
    </>
  );
}
