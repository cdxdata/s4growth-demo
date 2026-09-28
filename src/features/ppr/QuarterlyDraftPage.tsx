import { Header } from "@/components/layout/Header";
import { QueryState } from "@/components/ui/QueryState";
import { useQuarterlyDraft } from "@/features/ppr/useQuarterlyDraft";
import type { ReportField, ReportPage } from "@/lib/quarterReport";

function FieldList({ fields }: { fields: ReportField[] }) {
  return (
    <dl className="report-fields">
      {fields.map((field) => (
        <div key={field.label} className="report-field">
          <dt>{field.label}</dt>
          <dd>{field.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function ReportPageView({ page, quarterLabel }: { page: ReportPage; quarterLabel: string }) {
  return (
    <article className="report-page" aria-label={`Page ${page.number} of 12, ${page.title}`}>
      <header className="report-page-head">
        <span>Steps4Growth · Program Progress Report</span>
        <span>
          {quarterLabel} · Page {page.number} of 12
        </span>
      </header>
      <div className="report-page-kicker">{page.eyebrow}</div>
      <h2>{page.title}</h2>
      <p className="report-shell">{page.description}</p>
      <p className="report-narrative">{page.narrative}</p>
      {page.blocks.map((block, index) => (
        <section key={`${page.number}-${block.title ?? index}`} className="report-block">
          {block.title ? <h3>{block.title}</h3> : null}
          <FieldList fields={block.fields} />
        </section>
      ))}
      <footer className="report-page-foot">Draft for NC A&T human review · not transmitted to EDA</footer>
    </article>
  );
}

export function QuarterlyDraftPage() {
  const summary = useQuarterlyDraft();
  const report = summary.report;

  return (
    <QueryState isLoading={summary.isLoading} error={summary.error}>
      <div className="report-toolbar no-print">
        <Header title="Quarterly draft" subtitle={`${report.quarterLabel} · 12-page Program Progress Report`} />
        <div className="report-actions">
          <p className="report-source">{report.sourceLine}</p>
          <div>
            <button type="button" className="btn secondary" onClick={summary.print}>
              Print preview
            </button>{" "}
            <button type="button" className="btn primary" onClick={summary.generate} disabled={summary.isGenerating}>
              {summary.isGenerating ? "Generating…" : "Generate EDA workbook"}
            </button>
          </div>
        </div>
        {summary.confirmation ? (
          <div className="success">
            ✓ {summary.confirmation.fileName} generated on {summary.confirmation.generatedAt}. The workbook was downloaded
            locally; no data was transmitted to EDA.
          </div>
        ) : null}
      </div>
      <div className="report-book">
        {report.pages.map((page) => (
          <ReportPageView key={page.number} page={page} quarterLabel={report.quarterLabel} />
        ))}
      </div>
    </QueryState>
  );
}
