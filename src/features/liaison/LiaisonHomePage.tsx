import { Header } from "@/components/layout/Header";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { Stat } from "@/components/ui/Stat";
import { useLiaisonHome } from "@/features/liaison/useLiaisonHome";

export function LiaisonHomePage() {
  const summary = useLiaisonHome();

  return (
    <>
      <Header title={summary.name} subtitle="Participants placed with employers in your network." />
      <QueryState isLoading={summary.isLoading} error={summary.error}>
        <div className="grid stats">
          <Stat
            label="Participants under employ"
            value={summary.participantsEmployed}
            note="Currently employed through this liaison"
          />
        </div>
        <Panel>
          <Panel.Head>
            <Panel.Title
              title="Employment coverage"
              subtitle="This workspace tracks participants this liaison is supporting in jobs."
            />
          </Panel.Head>
          <div className="rep-block">
            <p className="empty-inline">
              {summary.participantsEmployed} participants are currently under employment through {summary.name}.
            </p>
          </div>
        </Panel>
      </QueryState>
    </>
  );
}
