import { Header } from "@/components/layout/Header";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { Stat } from "@/components/ui/Stat";
import { SubmissionBadge } from "@/components/ui/SubmissionBadge";
import { useTrainingProviderHome } from "@/features/tp/useTrainingProviderHome";

export function TrainingProviderHomePage() {
  const summary = useTrainingProviderHome();

  return (
    <>
      <Header title={summary.name} subtitle="Your training provider workspace." />
      <QueryState isLoading={summary.isLoading} error={summary.error}>
        <div className="grid stats three">
          <Stat
            label="Participants in training"
            value={summary.participantsInTraining}
            note="Completed Training is No"
          />
          <div className="stat">
            <div className="label">{summary.monthName} Submission Status</div>
            <div className="stat-status">
              {summary.submissionStatus ? <SubmissionBadge status={summary.submissionStatus} /> : "—"}
            </div>
          </div>
          <Stat
            label="Training programs"
            value={summary.programCount}
            note={summary.programs.join(" · ") || "No programs listed"}
          />
        </div>
        <Panel>
          <Panel.Head>
            <Panel.Title title="Programs offered" subtitle="Active training pathways at this organization" />
          </Panel.Head>
          <div className="program-list">
            {summary.programs.map((program) => (
              <div className="program-item" key={program}>
                {program}
              </div>
            ))}
          </div>
        </Panel>
      </QueryState>
    </>
  );
}
