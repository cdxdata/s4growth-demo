import { Header } from "@/components/layout/Header";
import { FieldMarks } from "@/components/ui/FieldMarks";
import { Panel } from "@/components/ui/Panel";
import { useInvoice } from "@/features/submissions/useInvoice";

export function InvoicePage() {
  const summary = useInvoice();

  return (
    <>
      <Header title="Invoice" subtitle={`${summary.monthLabel} Monthly Submission · ${summary.organizationName}`} hidePeriod />
      <div className="form-wrap">
        <button type="button" className="back" onClick={summary.goBack}>
          ← Monthly Submissions
        </button>
        <Panel className="form">
          <div className="section-title">
            <div className="num">01</div>
            <div>
              <h2>Monthly invoice</h2>
              <p>Record the invoice that belongs with this month’s packet. Number and amount are enough to mark it filled.</p>
            </div>
          </div>
          <div className="fields">
            <div className="field">
              <label>
                Invoice number <span className="req">*</span>
                {summary.showMarks ? <FieldMarks mark={summary.fieldMarks["invoice.invoiceNumber"]} /> : null}
              </label>
              <input name="invoiceNumber" value={summary.form.invoiceNumber} onChange={summary.change} />
            </div>
            <div className="field">
              <label>
                Amount (USD) <span className="req">*</span>
                {summary.showMarks ? <FieldMarks mark={summary.fieldMarks["invoice.amount"]} /> : null}
              </label>
              <input name="amount" type="number" min={0} step="0.01" inputMode="decimal" value={summary.form.amount} onChange={summary.change} />
            </div>
            <div className="field full">
              <label>
                Notes
                {summary.showMarks ? <FieldMarks mark={summary.fieldMarks["invoice.notes"]} /> : null}
              </label>
              <textarea
                name="notes"
                placeholder="Optional description of charges or supporting files."
                value={summary.form.notes}
                onChange={summary.change}
              />
            </div>
          </div>
          <div className="form-foot">
            <button type="button" className="btn secondary" onClick={summary.goBack}>
              Cancel
            </button>
            <button type="button" className="btn primary" onClick={summary.save}>
              Save Submission
            </button>
          </div>
        </Panel>
      </div>
    </>
  );
}
