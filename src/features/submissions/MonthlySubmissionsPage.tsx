import { Header } from "@/components/layout/Header";
import { DocumentStatusBadge } from "@/components/ui/DocumentStatusBadge";
import { PackageStatusBadge } from "@/components/ui/PackageStatusBadge";
import { useMonthlySubmissions } from "@/features/submissions/useMonthlySubmissions";

export function MonthlySubmissionsPage() {
  const summary = useMonthlySubmissions();

  return (
    <>
      <Header
        title="Monthly Submissions"
        subtitle={`${summary.organizationName} · ${summary.quarterLabel}. Complete the technical report and EDA Survey before you submit.`}
      />
      <section className="submissions-board">
        <div className="submissions-head">
          <span>Submission</span>
          <span>Status</span>
          <span className="visually-hidden">Expand</span>
        </div>
        {summary.rows.map((row) => {
          const open = summary.expandedId === row.periodId;
          return (
            <article key={row.periodId} className={`submission-card${open ? " open" : ""}`}>
              <button
                type="button"
                className="submission-card-row"
                aria-expanded={open}
                onClick={() => summary.toggle(row.periodId)}
              >
                <div>
                  <strong>{row.title}</strong>
                  <span className="submission-due">{row.dueLabel}</span>
                </div>
                <PackageStatusBadge status={row.status} />
                <span className="submission-caret" aria-hidden>
                  {open ? "▾" : "›"}
                </span>
              </button>
              {open ? (
                <div className="submission-card-body">
                  <ul className="document-list">
                    {row.documents.map((document) => (
                      <li key={document.kind}>
                        <div>
                          <b>{document.label}</b>
                          <DocumentStatusBadge state={document.state} />
                        </div>
                        <button
                          type="button"
                          className="btn secondary"
                          onClick={() => summary.editDocument(row.periodId, document.kind)}
                        >
                          Edit
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="submission-card-foot">
                    <p>
                      Submit is available when the technical report and EDA Survey are both marked filled.
                    </p>
                    <button
                      type="button"
                      className="btn primary"
                      disabled={!row.canSubmit}
                      onClick={() => summary.submitPackage(row.periodId)}
                    >
                      {row.status === "Approved" ? "Approved" : row.status === "Submitted" ? "Submitted" : "Submit"}
                    </button>
                  </div>
                </div>
              ) : null}
            </article>
          );
        })}
      </section>
    </>
  );
}
