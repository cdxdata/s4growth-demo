import { Header } from "@/components/layout/Header";
import { CheckItem } from "@/components/ui/CheckItem";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { useReview } from "@/features/review/useReview";

export function ReviewPage() {
  const summary = useReview();

  return (
    <QueryState isLoading={summary.isLoading} error={summary.error}>
      <Header title="Review queue" subtitle="Please complete these reviews" />
      <Panel>
        <Panel.Head>
          <Panel.Title title="Submissions requiring review" subtitle="Prioritized by impact on the monthly file" />
        </Panel.Head>
        {summary.queue.length ? (
          <div className="checklist">
            {summary.queue.map((item) => (
              <CheckItem
                key={item.id}
                label={item.label}
                text={item.text}
                status={item.status}
                onSelect={() => summary.openMonthly(item.id)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-inline">
            No submissions require review this month.
          </div>
        )}
      </Panel>
    </QueryState>
  );
}
