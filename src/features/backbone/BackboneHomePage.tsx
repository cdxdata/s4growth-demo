import { Header } from "@/components/layout/Header";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { Stat } from "@/components/ui/Stat";
import { SubmissionBadge } from "@/components/ui/SubmissionBadge";
import { useBackboneHome } from "@/features/backbone/useBackboneHome";

export function BackboneHomePage() {
  const summary = useBackboneHome();

  return (
    <>
      <Header title={summary.name} subtitle="Training providers in your backbone network." />
      <QueryState isLoading={summary.isLoading} error={summary.error}>
        <div className="grid stats">
          <Stat
            label="Training providers overseen"
            value={`${summary.trainingProviderCount}/4`}
            note="A backbone oversees at most four training providers"
          />
        </div>
        <Panel>
          <Panel.Head>
            <Panel.Title title="Submission status" subtitle="Current cycle for providers in this backbone" />
          </Panel.Head>
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Training provider</th>
                <th>Submission status</th>
              </tr>
            </thead>
            <tbody>
              {summary.providers.map((provider) => (
                <tr key={provider.id}>
                  <td>
                    <div className="provider">{provider.name}</div>
                  </td>
                  <td>
                    <SubmissionBadge status={provider.submissionStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </QueryState>
    </>
  );
}
