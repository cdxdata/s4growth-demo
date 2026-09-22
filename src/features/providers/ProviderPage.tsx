import { CheckItem } from "@/components/ui/CheckItem";
import { ContactItem } from "@/components/ui/ContactItem";
import { EventItem } from "@/components/ui/EventItem";
import { Metric } from "@/components/ui/Metric";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { SubmissionBadge } from "@/components/ui/SubmissionBadge";
import { useProvider } from "@/features/providers/useProvider";

export function ProviderPage() {
  const summary = useProvider();
  const provider = summary.provider;

  return (
    <QueryState isLoading={summary.isLoading} error={summary.error}>
      {provider ? (
        <>
          <div className="detail-top">
            <button className="back" onClick={summary.goBack}>
              ← Dashboard
            </button>
            <div className="detail-title" style={{ flex: 1 }}>
              <div>
                <div className="eyebrow">
                  {provider.type} · {provider.code}
                </div>
                <h2>{provider.name}</h2>
                <p>
                  {provider.program} · {provider.region}
                </p>
              </div>
              <SubmissionBadge status={provider.submissionStatus} />
            </div>
          </div>
          <div className="tabs">
            <button className="active">Overview</button>
            <button onClick={summary.openIntake}>Monthly Submissions</button>
            <button onClick={summary.openParticipants}>Participant data</button>
            <button onClick={summary.openReview}>Review history</button>
          </div>
          <div className="grid two">
            <Panel>
              <Panel.Head>
                <Panel.Title title="September reporting checklist" subtitle={summary.checklistSubtitle} />
                {summary.canCompleteIntake ? (
                  <button className="btn primary" onClick={summary.openIntake}>
                    Complete submission
                  </button>
                ) : null}
              </Panel.Head>
              <div className="checklist">
                {summary.checklist.map((item) => (
                  <CheckItem key={item.id} ok={item.ok} label={item.label} text={item.text} />
                ))}
              </div>
            </Panel>
            <Panel>
              <Panel.Head>
                <Panel.Title title="Nudge recipients" subtitle="Configured contacts for reporting follow-up" />
              </Panel.Head>
              {summary.contacts.map((contact) => (
                <ContactItem key={contact.name} {...contact} />
              ))}
              <div style={{ padding: 14 }}>
                <button className="btn secondary" onClick={summary.openNudges}>
                  Preview reminder
                </button>
              </div>
            </Panel>
          </div>
          <div className="grid two" style={{ marginTop: 18 }}>
            <Panel>
              <Panel.Head>
                <h2>Selected September metrics</h2>
                <button className="link" onClick={summary.openParticipants}>
                  View records →
                </button>
              </Panel.Head>
              <div className="metric-row">
                <Metric value={provider.enrolled} label="Enrolled" />
                <Metric value={provider.completed} label="Completed" />
                <Metric value={provider.placed} label="Placed" />
                <Metric value={summary.openGaps} label="Open gaps" />
              </div>
            </Panel>
            <Panel>
              <Panel.Head>
                <h2>Activity</h2>
              </Panel.Head>
              <div className="activity">
                {summary.activity.map((event) => (
                  <EventItem key={event.title} icon={event.icon} title={event.title} text={event.text} />
                ))}
              </div>
            </Panel>
          </div>
        </>
      ) : (
        <div className="empty">That subawardee is not in this demo workspace.</div>
      )}
    </QueryState>
  );
}
