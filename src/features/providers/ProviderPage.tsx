import { useEffect } from "react";
import { ContactItem } from "@/components/ui/ContactItem";
import { DocumentCheckItem } from "@/components/ui/DocumentCheckItem";
import { EventItem } from "@/components/ui/EventItem";
import { Metric } from "@/components/ui/Metric";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { SubmissionBadge } from "@/components/ui/SubmissionBadge";
import { ProviderMonthlyReview } from "@/features/providers/ProviderMonthlyReview";
import { SubawardeeSwitcher } from "@/features/providers/SubawardeeSwitcher";
import { useProvider } from "@/features/providers/useProvider";
import { useSubawardeeSwitcher } from "@/features/providers/useSubawardeeSwitcher";

export function ProviderPage() {
  const summary = useProvider();
  const switcher = useSubawardeeSwitcher(summary.providerId);
  const provider = summary.provider;
  const title = provider?.name ?? switcher.current?.name ?? "Subawardee";
  const status = provider?.submissionStatus ?? switcher.current?.submissionStatus;
  const showNudgeRecipients = status === "Not started" || status === "Missing/flagged";

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [summary.providerId, summary.tab]);

  return (
    <>
      <div className="detail-top">
        <button className="back" onClick={summary.goBack}>
          ← Dashboard
        </button>
        <div className="detail-title">
          <div>
            <div className="eyebrow">{provider ? `${provider.type} · ${provider.code}` : "Training provider"}</div>
            <div className="detail-title-heading">
              <h2>{title}</h2>
              <SubawardeeSwitcher summary={switcher} />
            </div>
            <p>
              {provider ? `${provider.program} · ${provider.region}` : "Select a subawardee to view reporting details."}
            </p>
          </div>
        </div>
      </div>
      <QueryState isLoading={summary.isLoading} error={summary.error}>
        {provider ? (
          <>
            <div className="tabs">
              <button className={summary.tab === "overview" ? "active" : undefined} onClick={() => summary.openTab("overview")}>
                Overview
              </button>
              <button className={summary.tab === "monthly" ? "active" : undefined} onClick={() => summary.openTab("monthly")}>
                Monthly Submissions
              </button>
              <button onClick={summary.openParticipants}>Participant data</button>
              <button onClick={summary.openReview}>Review history</button>
            </div>
            {summary.tab === "monthly" ? (
              <ProviderMonthlyReview />
            ) : (
              <>
                <div className={showNudgeRecipients ? "grid two" : undefined}>
                  <Panel>
                    <Panel.Head>
                      <Panel.Title title={summary.checklistTitle} subtitle={summary.checklistSubtitle} />
                      {status ? <SubmissionBadge status={status} /> : null}
                    </Panel.Head>
                    <div className="checklist">
                      {summary.documents.map((item) => (
                        <DocumentCheckItem key={item.id} label={item.label} text={item.text} tone={item.tone} />
                      ))}
                    </div>
                  </Panel>
                  {showNudgeRecipients ? (
                    <Panel>
                      <Panel.Head>
                        <Panel.Title title="Nudge recipients" subtitle="Configured contacts for reporting follow-up" />
                      </Panel.Head>
                      {summary.representatives.length ? (
                        summary.representatives.map((rep) => (
                          <ContactItem key={rep.id} name={rep.name} email={rep.email} />
                        ))
                      ) : (
                        <div className="empty-inline">
                          No representatives registered for this organization.
                        </div>
                      )}
                      <div className="panel-inset">
                        <button className="btn secondary" onClick={summary.openNudges}>
                          Preview reminder
                        </button>
                      </div>
                    </Panel>
                  ) : null}
                </div>
                <div className="grid two">
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
            )}
          </>
        ) : (
          <div className="empty">That subawardee is not in this demo workspace.</div>
        )}
      </QueryState>
    </>
  );
}
