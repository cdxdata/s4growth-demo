import { Header } from "@/components/layout/Header";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { useQuarterlyDraft } from "@/features/ppr/useQuarterlyDraft";

export function QuarterlyDraftPage() {
  const summary = useQuarterlyDraft();
  const draft = summary.draft;

  return (
    <QueryState isLoading={summary.isLoading} error={summary.error}>
      <Header title="Quarterly draft" subtitle={`${summary.quarter} · Draft for NC A&T human review`} />
      {draft ? (
        <Panel className="report">
          <div className="report-kicker">Steps4Growth · Program Progress Report</div>
          <h1>Quarterly progress draft</h1>
          <div className="report-lead">
            This synthetic-data draft combines selected participant rollups with structured monthly updates. It is a
            review aid, not an EDA-ready final submission.
          </div>
          <div className="report-metrics">
            <div className="report-metric">
              <b>{draft.enrolled}</b>
              <span>Participants enrolled</span>
            </div>
            <div className="report-metric">
              <b>{draft.completions}</b>
              <span>Training completions</span>
            </div>
            <div className="report-metric">
              <b>{draft.placements}</b>
              <span>Job placements</span>
            </div>
          </div>
          <h2>Program achievements</h2>
          <p>{draft.achievements}</p>
          <h2>Challenges and response</h2>
          <p>{draft.challenges}</p>
          <p>
            <b>Action plan:</b> {draft.plan}
          </p>
          <h2>Success story</h2>
          <div className="quote">{draft.quote}</div>
          <p>
            Participant stories and supporting narratives can be gathered through the structured monthly intake, then
            made available for human editing in the quarterly report.
          </p>
          <div
            style={{
              borderTop: "1px solid var(--line)",
              paddingTop: 20,
              marginTop: 28,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: 11, color: "var(--muted)" }}>
              Draft status · synthetic data · {draft.fromIntake ? "updated from monthly intake" : "updated today"}
            </span>
            <button className="btn secondary" onClick={summary.print}>
              Print preview
            </button>
          </div>
        </Panel>
      ) : null}
    </QueryState>
  );
}
