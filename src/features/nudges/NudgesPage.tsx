import { Header } from "@/components/layout/Header";
import { CheckItem } from "@/components/ui/CheckItem";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { Status } from "@/components/ui/Status";
import { useNudges } from "@/features/nudges/useNudges";

export function NudgesPage() {
  const summary = useNudges();
  const selected = summary.followUp.find((item) => item.id === summary.selectedId);

  return (
    <QueryState isLoading={summary.isLoading} error={summary.error}>
      <Header title="Smart nudges" subtitle="Clear follow-up, directed to the people best positioned to respond." />
      <section className="nudge-workspace">
        <div className="nudge-list">
          <div className="panel-head">
            <Panel.Title title="Recommended follow-up" subtitle="Based on missing items and reporting due date" />
            {summary.timelineStatus ? (
              <Status tone={summary.timelineStatus.includes("late") ? "late" : "review"}>{summary.timelineStatus}</Status>
            ) : null}
          </div>
          <div className="checklist">
            {summary.followUp.length ? (
              summary.followUp.map((item) => (
                <CheckItem
                  key={item.id}
                  label={item.label}
                  text={item.text}
                  status={item.status}
                  selected={item.id === summary.selectedId}
                  onSelect={() => summary.selectFollowUp(item.id)}
                />
              ))
            ) : (
              <div className="empty-inline">
                No subawardees need follow-up this month.
              </div>
            )}
          </div>
        </div>
        <div className="nudge-preview">
          <div className="panel-head">
            <Panel.Title
              title="Reminder preview"
              subtitle={selected ? `Email for ${selected.label}` : "Select a subawardee to preview the reminder."}
            />
          </div>
          {summary.message ? (
            <div className="message">
              <div className="to">
                <b>To:</b> {summary.message.to}
                <br />
                <span className="nudge-cc">
                  <b>CC:</b> {summary.message.cc}
                </span>
              </div>
              <div className="subject">{summary.message.subject}</div>
              <p>{summary.message.body}</p>
              <button
                className="btn primary"
                onClick={summary.sendReminder}
                disabled={Boolean(summary.sent) || summary.sending}
              >
                {summary.sent ? "Reminder logged" : summary.sending ? "Sending…" : "Send simulated reminder"}
              </button>
              {summary.sent ? (
                <div className="success">
                  ✓ Notification logged permanently in this browser.
                  <br />
                  <b>{summary.sent.organization}</b> · {summary.sent.recipient} · {summary.sent.timestamp}
                  <br />
                  <span className="success-note">Status: Simulated sent. Reloading the page will keep this record.</span>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="empty-inline">
              Select a recommended follow-up to see the reminder.
            </div>
          )}
        </div>
      </section>
      <Panel className="outbox">
        <Panel.Head>
          <Panel.Title title="Notification outbox" subtitle="Persistent history of reminders and review-status messages" />
          <Status tone={summary.outbox.length ? "complete" : "draft"}>{summary.outbox.length} logged</Status>
        </Panel.Head>
        {summary.outbox.length ? (
          <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Recipients</th>
                <th>Subject</th>
                <th>Sent</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {summary.outbox.map((mail) => (
                <tr key={mail.id}>
                  <td>{mail.recipients.join(", ")}</td>
                  <td>{mail.subject}</td>
                  <td>{mail.sentOn}</td>
                  <td><Status tone="complete">Simulated sent</Status></td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        ) : (
          <div className="empty-inline">Sent reminders will appear here.</div>
        )}
      </Panel>
    </QueryState>
  );
}
