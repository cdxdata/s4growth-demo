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
            This synthetic-data draft is assembled from the provider’s structured monthly submissions. It remains a
            review aid until NC A&amp;T supplies the final PPR template.
          </div>
          <div className="notice">
            <b>Data provenance:</b>{" "}
            {draft.sources?.map((source) => `${source.label} (${source.status})`).join(" · ") || "No monthly sources"}
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
            Participant stories and supporting narratives can be gathered through the structured monthly submissions, then
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
              Draft status · synthetic data · {draft.fromIntake ? "updated from monthly submissions" : "updated today"}
            </span>
            <div>
              <button className="btn secondary" onClick={summary.print}>
                Print preview
              </button>{" "}
              <button className="btn primary" onClick={summary.generate} disabled={summary.isGenerating}>
                {summary.isGenerating ? "Generating…" : "Generate EDA workbook"}
              </button>
            </div>
          </div>
          {summary.confirmation ? (
            <div className="success">
              ✓ {summary.confirmation.fileName} generated on {summary.confirmation.generatedAt}. The workbook was
              downloaded locally; no data was transmitted to EDA.
            </div>
          ) : null}
        </Panel>
      ) : null}
    </QueryState>
  );
}
