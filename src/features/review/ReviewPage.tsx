import { Header } from "@/components/layout/Header";
import { FlagItem } from "@/components/ui/FlagItem";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { Stat } from "@/components/ui/Stat";
import { useReview } from "@/features/review/useReview";

export function ReviewPage() {
  const summary = useReview();

  return (
    <QueryState isLoading={summary.isLoading} error={summary.error}>
      <Header title="Review queue" subtitle="Flags guide human attention; they do not make reporting decisions." />
      <div className="grid stats">
        {summary.stats.map((stat) => (
          <Stat key={stat.label} label={stat.label} value={stat.value} note={stat.note} tone={stat.tone} />
        ))}
      </div>
      <Panel>
        <Panel.Head>
          <Panel.Title title="Items requiring review" subtitle="Prioritized by impact on the monthly file" />
        </Panel.Head>
        {summary.flags.map((flag) => (
          <FlagItem key={flag.id} flag={flag} onAction={summary.handleFlag} />
        ))}
      </Panel>
    </QueryState>
  );
}
