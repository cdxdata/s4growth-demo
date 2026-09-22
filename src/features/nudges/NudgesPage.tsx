import { Header } from "@/components/layout/Header";
import { CheckItem } from "@/components/ui/CheckItem";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { Status } from "@/components/ui/Status";
import { useNudges } from "@/features/nudges/useNudges";

export function NudgesPage() {
  const summary = useNudges();

  return (
    <QueryState isLoading={summary.isLoading} error={summary.error}>
      <Header title="Smart nudges" subtitle="Clear follow-up, directed to the people best positioned to respond." />
      <div className="grid two">
        <Panel>
          <Panel.Head>
            <Panel.Title title="Recommended follow-up" subtitle="Based on missing items and reporting due date" />
            <Status tone="late">{summary.overdueCount} overdue</Status>
          </Panel.Head>
          <div className="checklist">
            {summary.followUp.map((item) => (
              <CheckItem key={item.id} ok={item.ok} label={item.label} text={item.text} />
            ))}
          </div>
        </Panel>
        <Panel>
          <Panel.Head>
            <Panel.Title title="Reminder preview" subtitle="Email delivery is safely simulated for this demo." />
          </Panel.Head>
          {summary.message ? (
            <div className="message">
              <div className="to">
                <b>To:</b> {summary.message.to}
                <br />
                <span style={{ color: "var(--muted)" }}>
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
                  <span style={{ fontSize: 11 }}>Status: Simulated sent. Reloading the page will keep this record.</span>
                </div>
              ) : null}
            </div>
          ) : null}
        </Panel>
      </div>
    </QueryState>
  );
}
