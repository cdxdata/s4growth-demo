import { Header } from "@/components/layout/Header";
import { EdaReviewSections } from "@/components/ui/FormReview";
import { useEdaReview } from "@/features/submissions/useEdaReview";

export function EdaReviewPage() {
  const summary = useEdaReview();

  return (
    <>
      <Header title="Review EDA Survey" subtitle={`${summary.monthLabel} Monthly Submission · ${summary.organizationName}`} hidePeriod />
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
          Check each of the 10 forms before you finish. You can edit a page without losing the rest of the survey.
        </p>
        <EdaReviewSections
          sections={summary.sections}
          sectionReviews={summary.sectionReviews}
          onEdit={summary.editSection}
        />
        <div className="form-foot eda-review-foot">
          <button type="button" className="btn secondary" onClick={summary.goBack}>
            Save Submission
          </button>
          <button type="button" className="btn primary" onClick={summary.done}>
            Done
          </button>
        </div>
      </div>
    </>
  );
}
