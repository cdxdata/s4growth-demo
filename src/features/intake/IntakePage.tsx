import { Header } from "@/components/layout/Header";
import { Panel } from "@/components/ui/Panel";
import { useIntake } from "@/features/intake/useIntake";

export function IntakePage() {
  const summary = useIntake();

  return (
    <>
      <Header title="Monthly technical report" subtitle={`${summary.monthLabel} · ${summary.organizationName}`} />
      <div className="form-wrap">
        <button type="button" className="back" onClick={summary.goBack}>
          {summary.isTrainingProvider ? "← Monthly Submissions" : "← Subawardee"}
        </button>
        <div className="stepper">
          <div className="step on">
            <i>1</i>Program update
          </div>
          <div className="step">
            <i>2</i>Outcomes
          </div>
          <div className="step">
            <i>3</i>Review and submit
          </div>
        </div>
        {summary.error ? <div className="notice error">{summary.error}</div> : null}
        <Panel className="form">
          <div className="section-title">
            <div className="num">01</div>
            <div>
              <h2>Program update</h2>
              <p>Replace the open-ended Word attachment with a clear, guided response.</p>
            </div>
          </div>
          <div className="fields">
            <div className="field full">
              <label>
                Successes, achievements, or notable events <span className="req">*</span>
              </label>
              <textarea name="achievements" value={summary.form.achievements} onChange={summary.change} />
              <span className="helper">Include activity from this month or performance quarter.</span>
            </div>
            <div className="field full">
              <label>
                Challenges encountered <span className="req">*</span>
              </label>
              <textarea
                name="challenges"
                placeholder="Describe the challenge and its effect on delivery..."
                value={summary.form.challenges}
                onChange={summary.change}
              />
            </div>
            <div className="field full">
              <label>
                Plan to address challenges <span className="req">*</span>
              </label>
              <textarea
                name="plan"
                placeholder="List practical steps planned for the next month and quarter..."
                value={summary.form.plan}
                onChange={summary.change}
              />
            </div>
            <div className="field">
              <label>Training completions reported</label>
              <input value="12" readOnly />
              <span className="helper">Will be checked against participant records.</span>
            </div>
            <div className="field">
              <label>Job placements reported</label>
              <input value="7" readOnly />
              <span className="helper">Pulled from synthetic participant records.</span>
            </div>
            <div className="field full">
              <label>Participant feedback or success story</label>
              <textarea
                name="story"
                placeholder="Optional testimonial, success story, or link to supporting material..."
                value={summary.form.story}
                onChange={summary.change}
              />
            </div>
          </div>
          <div className="form-foot">
            <button className="btn secondary" onClick={summary.saveDraft}>
              Save Submission
            </button>
            {summary.isTrainingProvider ? null : (
              <button className="btn primary" onClick={summary.submit} disabled={summary.isSubmitting}>
                {summary.isSubmitting ? "Submitting…" : "Submit for review →"}
              </button>
            )}
          </div>
        </Panel>
      </div>
    </>
  );
}
