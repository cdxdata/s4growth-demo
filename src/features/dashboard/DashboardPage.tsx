import { Header } from "@/components/layout/Header";
import { EventItem } from "@/components/ui/EventItem";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { Stat } from "@/components/ui/Stat";
import { SubmissionBadge } from "@/components/ui/SubmissionBadge";
import { ImpactCard } from "@/features/dashboard/ImpactCard";
import { useDashboard, type DashboardRow } from "@/features/dashboard/useDashboard";

export function DashboardPage() {
  const summary = useDashboard();

  return (
    <>
      <Header title="Reporting dashboard" subtitle={summary.pageSubtitle} />
      <QueryState isLoading={summary.isLoading} error={summary.error}>
        <div className="grid stats">
          {summary.stats.map((stat) => (
            <Stat
              key={stat.label}
              label={stat.label}
              value={stat.value}
              note={stat.note}
              tone={stat.tone}
              onClick={stat.onClick}
            />
          ))}
        </div>
        <div className="impact">
          {summary.impact.map((card) => (
            <ImpactCard key={card.id} card={card} />
          ))}
        </div>
        <Panel>
          <Panel.Head>
            <Panel.Title title={summary.panelTitle} subtitle={summary.panelSubtitle} />
            <div className="status-filters" role="tablist" aria-label="Submission status">
              {summary.statusFilters.map((filter) => {
                const active = filter.id === summary.statusFilter;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    className={`status-filter${active ? " active" : ""}`}
                    onClick={() => summary.setStatusFilter(filter.id)}
                  >
                    {filter.label} ({filter.count})
                  </button>
                );
              })}
            </div>
          </Panel.Head>
          <div className="table-scroll">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Subawardee</th>
                <th>Submission status</th>
                <th>Completed date</th>
                <th>Timeline status</th>
                <th>Last notified</th>
              </tr>
            </thead>
            <tbody>
              {summary.rows.map((row) => (
                <ProviderRow key={row.id} row={row} onOpen={() => summary.openProvider(row.id)} />
              ))}
            </tbody>
          </table>
          </div>
        </Panel>
        <div className="grid two">
          <Panel>
            <Panel.Head>
              <Panel.Title title="Review priority" subtitle="Items requiring a human decision" />
              <button className="link" onClick={summary.openReview}>
                Open queue →
              </button>
            </Panel.Head>
            <div className="activity">
              {summary.priority.map((event) => (
                <EventItem key={event.title} icon={event.icon} title={event.title} text={event.text} />
              ))}
            </div>
          </Panel>
          <Panel>
            <Panel.Head>
              <h2>Why this matters</h2>
            </Panel.Head>
            <div className="why-copy">
              <div className="why-kicker">Days → hours</div>
              <p>
                Structured monthly submissions and visible gaps help the team spend less time finding files and chasing missing
                information.
              </p>
              <button className="btn primary" onClick={summary.openIntake}>
                Open Monthly Submissions
              </button>
            </div>
          </Panel>
        </div>
      </QueryState>
    </>
  );
}

function ProviderRow({ row, onOpen }: { row: DashboardRow; onOpen: () => void }) {
  return (
    <tr className="click" onClick={onOpen}>
      <td>
        <div className="subawardee-cell">
          <span className="category-chip">{row.category}</span>
          <div className="provider">{row.name}</div>
          {row.backbone ? <span className="subawardee-via">via {row.backbone}</span> : null}
        </div>
      </td>
      <td>
        <SubmissionBadge status={row.submissionStatus} />
      </td>
      <td className="completed-date">{row.completedDate}</td>
      <td className="timeline-status">{row.timelineStatus}</td>
      <td className="last-notified">{row.lastNotified}</td>
    </tr>
  );
}
