import { Navigate } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Panel } from "@/components/ui/Panel";
import { useEdaSurvey } from "@/features/submissions/useEdaSurvey";
import { isEdaSegmentValid } from "@/lib/submissionDocuments";
import type { EdaField } from "@/constants/eda";

export function EdaSurveyPage() {
  const summary = useEdaSurvey();
  if (summary.redirectTo) return <Navigate to={summary.redirectTo} replace />;

  const { segment, draft } = summary;
  const invalidSegment = summary.showErrors && !isEdaSegmentValid(segment.id, draft);

  return (
    <>
      <Header title="EDA Survey" subtitle={`${summary.monthLabel} Monthly Submission · ${summary.organizationName}`} />
      <div className="form-wrap eda-wrap">
        <button type="button" className="back" onClick={summary.goBack}>
          ← Monthly Submissions
        </button>
        <div className="eda-form-title">
          <div>
            <div className="eyebrow">Form</div>
            <h2>{summary.formTitle}</h2>
          </div>
          <span className="eda-step-count">
            {summary.segmentIndex + 1} of {summary.segments.length}
          </span>
        </div>
        <nav className="eda-segments" aria-label="EDA Survey sections">
          {summary.segments.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`eda-segment${item.current ? " current" : ""}`}
              disabled={!item.reachable}
              onClick={() => summary.goSegment(item.id)}
            >
              {item.title}
            </button>
          ))}
        </nav>
        {summary.error ? <div className="notice error">{summary.error}</div> : null}
        <Panel className="form">
          <div className="eda-section-head">
            <h2>{segment.title}</h2>
            <p>{segment.description}</p>
          </div>
          <div className="fields">
            {segment.fields.map((field) => (
              <EdaFieldInput
                key={field.key}
                field={field}
                value={draft[field.key]}
                invalid={invalidSegment && Boolean(field.required) && !draft[field.key].trim()}
                onChange={summary.change}
              />
            ))}
            {segment.id === "training-provider" ? (
              <div className="field full">
                <label>
                  {summary.programs.length === 1 ? "Training Program" : "Training programs"} <span className="req">*</span>
                </label>
                <span className="helper">At least one program is required. Add more if this month covers additional pathways.</span>
                <div className="program-fields">
                  {summary.programs.map((program, index) => (
                    <div className="program-field" key={`program-${index}`}>
                      <input
                        value={program}
                        placeholder={
                          summary.programs.length === 1
                            ? "Training Program Field"
                            : `Training Program ${index + 1}`
                        }
                        aria-label={
                          summary.programs.length === 1 ? "Training Program" : `Training Program ${index + 1}`
                        }
                        className={invalidSegment && !summary.programs.some((item) => item.trim()) ? "invalid" : undefined}
                        onChange={(event) => summary.changeProgram(index, event.target.value)}
                      />
                      {summary.programs.length > 1 ? (
                        <button type="button" className="btn ghost" onClick={() => summary.removeProgram(index)}>
                          Remove
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
                <button type="button" className="add-program" onClick={summary.addProgram} disabled={!summary.canAddProgram}>
                  + Add training program
                </button>
              </div>
            ) : null}
          </div>
          <div className="form-foot">
            <button type="button" className="btn secondary" onClick={summary.saveSubmission}>
              Save Submission
            </button>
            <button type="button" className="btn primary" onClick={summary.saveAndContinue}>
              Save & Continue
            </button>
          </div>
        </Panel>
      </div>
    </>
  );
}

function EdaFieldInput({
  field,
  value,
  invalid,
  onChange,
}: {
  field: EdaField;
  value: string;
  invalid: boolean;
  onChange: ReturnType<typeof useEdaSurvey>["change"];
}) {
  const id = `eda-${field.key}`;
  return (
    <div className={`field${field.full ? " full" : ""}`}>
      <label htmlFor={id}>
        {field.label}
        {field.required ? <span className="req"> *</span> : null}
      </label>
      {field.type === "select" ? (
        <select
          id={id}
          name={field.key}
          value={value}
          className={invalid ? "invalid" : undefined}
          onChange={onChange}
        >
          <option value="">Select…</option>
          {field.options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.type === "textarea" ? (
        <textarea
          id={id}
          name={field.key}
          value={value}
          placeholder={field.placeholder}
          className={invalid ? "invalid" : undefined}
          onChange={onChange}
        />
      ) : (
        <input
          id={id}
          name={field.key}
          type={field.type}
          inputMode={field.type === "number" ? "decimal" : undefined}
          min={field.type === "number" ? 0 : undefined}
          step={field.type === "number" ? "any" : undefined}
          value={value}
          placeholder={field.placeholder}
          className={invalid ? "invalid" : undefined}
          onChange={onChange}
        />
      )}
      {field.helper ? <span className="helper">{field.helper}</span> : null}
    </div>
  );
}
