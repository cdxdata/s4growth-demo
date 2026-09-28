import { Header } from "@/components/layout/Header";
import { DocumentStatusBadge } from "@/components/ui/DocumentStatusBadge";
import { PackageStatusBadge } from "@/components/ui/PackageStatusBadge";
import { SubmissionBadge } from "@/components/ui/SubmissionBadge";
import { useMonthlySubmissions } from "@/features/submissions/useMonthlySubmissions";

export function MonthlySubmissionsPage() {
  const summary = useMonthlySubmissions();

  return (
    <>
      <Header
        title="Monthly Submissions"
        subtitle={`${summary.organizationName}. Complete the EDA Survey and technical report before you submit.`}
        hidePeriod
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
                <div className="submission-card-copy">
                  {row.reviewStatus === "Missing/flagged" ? (
                    <span className="submission-attention" aria-label="Attention needed">
                      !
                    </span>
                  ) : null}
                  <div>
                    <strong>{row.title}</strong>
                    <span className="submission-due">{row.dueLabel}</span>
                  </div>
                </div>
                <span className="submission-status-stack">
                  <PackageStatusBadge status={row.status} />
                  {row.reviewStatus ? <SubmissionBadge status={row.reviewStatus} compact /> : null}
                </span>
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
                          {document.flagged ? (
                            <span className="submission-attention" aria-label="Attention needed">
                              !
                            </span>
                          ) : null}
                          <b>{document.label}</b>
                          <DocumentStatusBadge state={document.state} />
                        </div>
                        <div className="document-actions">
                          <button
                            type="button"
                            className="btn secondary"
                            onClick={() => summary.reviewDocument(row.periodId, document.kind)}
                          >
                            See Review
                          </button>
                          <button
                            type="button"
                            className="btn secondary"
                            onClick={() => summary.editDocument(row.periodId, document.kind)}
                          >
                            Edit
                          </button>
                        </div>
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
