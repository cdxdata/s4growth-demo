import { Header } from "@/components/layout/Header";
import { ReviewFieldList } from "@/components/ui/FormReview";
import { Panel } from "@/components/ui/Panel";
import { useDocumentReview } from "@/features/submissions/useDocumentReview";
import type { ReviewFormId } from "@/types/submissions";

export function DocumentReviewPage({ kind }: { kind: Exclude<ReviewFormId, "eda-survey"> }) {
  const summary = useDocumentReview(kind);

  return (
    <>
      <Header title={`Review ${summary.label}`} subtitle={`${summary.monthLabel} Monthly Submission · ${summary.organizationName}`} hidePeriod />
      <div className="form-wrap eda-wrap">
        <button type="button" className="back" onClick={summary.goBack}>
          ← Monthly Submissions
        </button>
        <div className="eda-form-title">
          <div>
            <div className="eyebrow">Review</div>
            <h2>{summary.label}</h2>
          </div>
        </div>
        <p className="eda-review-lead">Read-only copy of the submitted form, including any review marks.</p>
        <Panel className="eda-review-card">
          <ReviewFieldList fields={summary.fields} fieldMarks={summary.fieldMarks} showMarks={summary.showMarks} />
        </Panel>
        <div className="form-foot eda-review-foot">
          <button type="button" className="btn primary" onClick={summary.goBack}>
            Done
          </button>
        </div>
      </div>
    </>
  );
}
