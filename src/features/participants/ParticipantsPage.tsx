import { Header } from "@/components/layout/Header";
import { Metric } from "@/components/ui/Metric";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { Status } from "@/components/ui/Status";
import { useParticipants } from "@/features/participants/useParticipants";

export function ParticipantsPage() {
  const summary = useParticipants();

  return (
    <>
      <Header title="Participant data review" subtitle="Synthetic EDA-aligned records · Piedmont Community College" />
      <div className="notice">
        This demo uses fictional participants. The production EDA tool contains additional data points, macros, and
        reporting sheets.
      </div>
      <QueryState isLoading={summary.isLoading} error={summary.error}>
        <Panel>
          <Panel.Head>
            <Panel.Title title="Participant Database" subtitle="Selected fields used for monthly review and reconciliation" />
            <button
              className="btn secondary"
              onClick={summary.runImport}
              disabled={summary.importing || summary.imported}
            >
              {summary.importing ? "Reading workbook…" : summary.imported ? "Workbook imported ✓" : "Simulate workbook import"}
            </button>
          </Panel.Head>
          {summary.imported ? (
            <>
              <div className="success" style={{ margin: "16px 18px 0" }}>
                ✓ EDA Survey Tool imported: 18 participant records checked, 2 data-quality issues added to the review
                queue.
              </div>
              <div className="metric-row">
                {summary.metrics.map((metric) => (
                  <Metric key={metric.label} value={metric.value} label={metric.label} />
                ))}
              </div>
              <table>
                <thead>
                  <tr>
                    <th>Participant</th>
                    <th>Training start</th>
                    <th>Training end</th>
                    <th>Completed</th>
                    <th>Job start</th>
                    <th>Data quality</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.records.map((participant) => (
                    <tr key={participant.id}>
                      <td>
                        <span className="provider">
                          {participant.firstName} {participant.lastName}
                        </span>
                      </td>
                      <td>{participant.trainingStart}</td>
                      <td>{participant.trainingEnd}</td>
                      <td>{participant.completed}</td>
                      <td>{participant.jobStart}</td>
                      <td>
                        <Status tone={participant.tone}>{participant.dataQuality}</Status>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <div className="empty">
              <b>No workbook imported for this reporting cycle.</b>
              <br />
              <span>Use the button above to load and validate a synthetic EDA Survey Tool.</span>
            </div>
          )}
        </Panel>
      </QueryState>
    </>
  );
}
