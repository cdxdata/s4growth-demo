import type { ChangeEvent, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import {
  ADMISSIONS_COUNT_FIELDS,
  COMPLETION_COUNT_FIELDS,
  CREDENTIAL_TYPES,
  DATE_MONTHS,
  EARN_AND_LEARN_FIELDS,
  EMPLOYMENT_STATUS_FIELDS,
  EMPLOYMENT_TYPE_FIELDS,
  ENVIRONMENT_TYPES,
  NAICS_URL,
  NON_COMPLETION_REASON_FIELDS,
  PROGRAM_HOURS,
  PROGRAM_LENGTHS,
  SALARIES_FIELDS,
  SALARY_MEDIAN_HELPER,
  US_STATES,
  YES_NO,
  type EdaField,
} from "@/constants/eda";
import { Header } from "@/components/layout/Header";
import { FieldMarks } from "@/components/ui/FieldMarks";
import { Panel } from "@/components/ui/Panel";
import { useEdaSurvey } from "@/features/submissions/useEdaSurvey";
import { isEdaProgramSectionValid, isEdaSegmentValid, isParticipantValid, isValidZip } from "@/lib/submissionDocuments";
import type {
  AdmissionsProgram,
  CompletionProgram,
  EdaParticipant,
  InstitutionalProgram,
  NonCompletionProgram,
  SplitDate,
} from "@/types/submissions";

const ADMISSIONS_HELPER =
  "If no participants were recruited, admitted, and/or enrolled in this quarter, please enter 0 for the corresponding category";

export function EdaSurveyPage() {
  const summary = useEdaSurvey();
  if (summary.redirectTo) return <Navigate to={summary.redirectTo} replace />;

  const { segment, draft } = summary;
  const invalidSegment = summary.showErrors && !isEdaSegmentValid(segment.id, draft);

  return (
    <>
      <Header title="EDA Survey" subtitle={`${summary.monthLabel} Monthly Submission · ${summary.organizationName}`} hidePeriod />
      <div className="form-wrap eda-survey">
        <button type="button" className="back" onClick={summary.goBack}>
          ← Monthly Submissions
        </button>
        <div className="eda-sticky-head">
          <div className="eda-form-title">
            <div>
              <div className="eyebrow">Form</div>
              <h2>{summary.formTitle}</h2>
            </div>
            <span className="eda-step-count">
              {summary.segmentIndex + 1} of {summary.segments.length}
            </span>
          </div>
          <nav className="tabs eda-segments" aria-label="EDA Survey sections">
            {summary.segments.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.current ? "active" : undefined}
                disabled={!item.reachable}
                onClick={() => summary.goSegment(item.id)}
              >
                {item.title}
              </button>
            ))}
          </nav>
          <div className="eda-section-head">
            <p>{segment.description}</p>
          </div>
        </div>
        <div className="eda-wrap">
        {summary.error ? <div className="notice error">{summary.error}</div> : null}
        {segment.id === "training-provider" ? (
          <Panel className={formCardClass(invalidSegment)}>
            <div className="fields">
              {segment.fields.map((field) => (
                <EdaFieldInput
                  key={field.key}
                  field={field}
                  value={draft[field.key]}
                  invalid={invalidSegment && Boolean(field.required) && !draft[field.key].trim()}
                  onChange={summary.change}
                  mark={reviewMark(summary, `eda.training-provider.${field.key}`)}
                />
              ))}
              <div className="field full">
                <label>
                  Training Program <span className="req">*</span>
                  {reviewMark(summary, "eda.training-provider.trainingPrograms") ? (
                    <FieldMarks mark={reviewMark(summary, "eda.training-provider.trainingPrograms")} />
                  ) : null}
                </label>
                <span className="helper">Programs this provider already offers are filled in. Add more if needed.</span>
                <div className="program-fields">
                  {summary.programs.map((program, index) => (
                    <div className="program-field" key={`program-${index}`}>
                      <input
                        value={program}
                        placeholder={summary.programs.length === 1 ? "Training Program Field" : `Training Program ${index + 1}`}
                        aria-label={summary.programs.length === 1 ? "Training Program" : `Training Program ${index + 1}`}
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
            </div>
          </Panel>
        ) : null}
        {segment.id === "participant-database" ? <ParticipantDatabaseFields summary={summary} invalid={invalidSegment} /> : null}
        {segment.id === "institutional-information" ? <InstitutionalSections summary={summary} invalid={invalidSegment} /> : null}
        {segment.id === "admissions" ? <AdmissionsSections summary={summary} invalid={invalidSegment} /> : null}
        {segment.id === "training-completion" ? <CompletionSections summary={summary} invalid={invalidSegment} /> : null}
        {segment.id === "reason-for-non-completion" ? <NonCompletionSections summary={summary} invalid={invalidSegment} /> : null}
        {segment.id === "employment-type" ? <EmploymentTypeSections summary={summary} invalid={invalidSegment} /> : null}
        {segment.id === "earn-and-learn" ? <EarnAndLearnSections summary={summary} invalid={invalidSegment} /> : null}
        {segment.id === "salaries-of-participants" ? <SalariesSections summary={summary} invalid={invalidSegment} /> : null}
        {segment.id === "employment-status-6-months" ? <EmploymentStatusSections summary={summary} invalid={invalidSegment} /> : null}
        <div className="form-foot eda-review-foot">
          <button type="button" className="btn secondary" onClick={summary.saveSubmission}>
            Save Submission
          </button>
          <button type="button" className="btn primary" onClick={summary.saveAndContinue}>
            Save & Continue
          </button>
        </div>
        </div>
      </div>
    </>
  );
}

type SurveySummary = ReturnType<typeof useEdaSurvey>;

function setProvider(summary: SurveySummary, value: string) {
  summary.change({ target: { name: "trainingProvider", value } } as ChangeEvent<HTMLInputElement>);
}

function programTitle(name: string, index: number) {
  return name.trim() || `Program ${index + 1}`;
}

function formCardClass(invalid?: boolean) {
  return `eda-form-card${invalid ? " is-invalid" : ""}`;
}

function reviewMark(summary: SurveySummary, id: string) {
  return summary.showMarks ? summary.fieldMarks[id] : undefined;
}

function ProgramCard({
  title,
  children,
  invalid,
  mark,
}: {
  title: string;
  children: ReactNode;
  invalid?: boolean;
  mark?: "good" | "bad";
}) {
  return (
    <Panel className={`${formCardClass(invalid)}${mark === "bad" ? " is-flagged" : ""}`}>
      <div className="participant-card-head">
        <h3>{title}</h3>
        {mark ? <FieldMarks mark={mark} /> : null}
      </div>
      <div className="fields">{children}</div>
    </Panel>
  );
}

function ProviderProgramFields({
  provider,
  program,
  invalid,
  onProvider,
  onProgram,
}: {
  provider: string;
  program: string;
  invalid: boolean;
  onProvider: (value: string) => void;
  onProgram: (value: string) => void;
}) {
  return (
    <>
      <TextField label="Name of Training Provider" required value={provider} invalid={invalid && !provider.trim()} onChange={onProvider} full />
      <TextField label="Name of Training Program" required value={program} invalid={invalid && !program.trim()} onChange={onProgram} full />
    </>
  );
}

function InstitutionalSections({ summary, invalid }: { summary: SurveySummary; invalid: boolean }) {
  return (
    <div className="participant-stack">
      {summary.draft.institutional.map((item, index) => (
        <InstitutionalCard
          key={`institutional-${index}`}
          item={item}
          index={index}
          invalid={invalid}
          onProvider={(value) => setProvider(summary, value)}
          onProgram={(value) => summary.changeProgram(index, value)}
          onChange={(patch) => summary.updateProgramRecord("institutional", index, patch)}
          onHour={(value) => summary.toggleInstitutionalHour(index, value)}
          mark={reviewMark(summary, `eda.institutional-information.${index}`)}
        />
      ))}
    </div>
  );
}

function InstitutionalCard({
  item,
  index,
  invalid,
  onProvider,
  onProgram,
  onChange,
  onHour,
  mark,
}: {
  item: InstitutionalProgram;
  index: number;
  invalid: boolean;
  onProvider: (value: string) => void;
  onProgram: (value: string) => void;
  onChange: (patch: Partial<InstitutionalProgram>) => void;
  onHour: (value: string) => void;
  mark?: "good" | "bad";
}) {
  return (
    <ProgramCard title={programTitle(item.trainingProgram, index)} invalid={invalid && !isEdaProgramSectionValid("institutional-information", item)} mark={mark}>
      <ProviderProgramFields provider={item.trainingProvider} program={item.trainingProgram} invalid={invalid} onProvider={onProvider} onProgram={onProgram} />
      <SelectField label="Length of Program" required value={item.programLength} options={PROGRAM_LENGTHS} invalid={invalid && !item.programLength} onChange={(value) => onChange({ programLength: value })} />
      <SelectField label="Environment Type" required value={item.environmentType} options={ENVIRONMENT_TYPES} invalid={invalid && !item.environmentType} onChange={(value) => onChange({ environmentType: value })} />
      <fieldset className={`field full subfield-group${invalid && item.programHours.length === 0 ? " invalid-group" : ""}`}>
        <legend>
          Program Hours <span className="req">*</span>
        </legend>
        <span className="helper">Select all values that apply.</span>
        <div className="check-list">
          {PROGRAM_HOURS.map((option) => (
            <label key={option} className="check-option">
              <input type="checkbox" checked={item.programHours.includes(option)} onChange={() => onHour(option)} />
              {option}
            </label>
          ))}
        </div>
      </fieldset>
      <SelectField
        label="Does your training program include soft skill training?"
        required
        value={item.softSkillTraining}
        options={YES_NO}
        invalid={invalid && !item.softSkillTraining}
        onChange={(value) => onChange({ softSkillTraining: value })}
        full
      />
      <NumberField
        label="Program Tuition Cost (Actual Cost)"
        required
        value={item.tuitionCost}
        helper="Include all costs related to tuition and other required fees."
        invalid={invalid && item.tuitionCost.trim() === ""}
        onChange={(value) => onChange({ tuitionCost: value })}
      />
      <SelectField
        label="Type of Credential Attained (based on WIOA statutory definitions)"
        required
        value={item.credentialType}
        options={CREDENTIAL_TYPES}
        invalid={invalid && !item.credentialType}
        onChange={(value) => onChange({ credentialType: value })}
        full
      />
    </ProgramCard>
  );
}

function AdmissionsSections({ summary, invalid }: { summary: SurveySummary; invalid: boolean }) {
  return (
    <div className="participant-stack">
      {summary.draft.admissions.map((item, index) => (
        <ProgramCard key={`admissions-${index}`} title={programTitle(item.trainingProgram, index)} invalid={invalid && !isEdaProgramSectionValid("admissions", item)} mark={reviewMark(summary, `eda.admissions.${index}`)}>
          <ProviderProgramFields
            provider={item.trainingProvider}
            program={item.trainingProgram}
            invalid={invalid}
            onProvider={(value) => setProvider(summary, value)}
            onProgram={(value) => summary.changeProgram(index, value)}
          />
          {ADMISSIONS_COUNT_FIELDS.map((field) => (
            <NumberField
              key={field.key}
              label={field.label}
              required
              value={item[field.key as keyof AdmissionsProgram] as string}
              helper={ADMISSIONS_HELPER}
              invalid={invalid && item[field.key as keyof AdmissionsProgram] === ""}
              onChange={(value) => summary.updateProgramRecord("admissions", index, { [field.key]: value })}
              full
            />
          ))}
        </ProgramCard>
      ))}
    </div>
  );
}

function CompletionSections({ summary, invalid }: { summary: SurveySummary; invalid: boolean }) {
  return (
    <div className="participant-stack">
      {summary.draft.completions.map((item, index) => (
        <ProgramCard key={`completion-${index}`} title={programTitle(item.trainingProgram, index)} invalid={invalid && !isEdaProgramSectionValid("training-completion", item)} mark={reviewMark(summary, `eda.training-completion.${index}`)}>
          <ProviderProgramFields
            provider={item.trainingProvider}
            program={item.trainingProgram}
            invalid={invalid}
            onProvider={(value) => setProvider(summary, value)}
            onProgram={(value) => summary.changeProgram(index, value)}
          />
          <label className="check-option no-participants skip-section">
            <input type="checkbox" checked={item.skipNoCompletions} onChange={() => summary.toggleCompletionSkip(index)} />
            Check box and skip section if no participants completed training in the quarter
          </label>
          {item.skipNoCompletions ? (
            <p className="helper">Completion counts are hidden while this box is checked.</p>
          ) : (
            COMPLETION_COUNT_FIELDS.map((field) => (
              <NumberField
                key={field.key}
                label={field.label}
                required
                value={item[field.key as keyof CompletionProgram] as string}
                invalid={invalid && item[field.key as keyof CompletionProgram] === ""}
                onChange={(value) => summary.updateProgramRecord("completions", index, { [field.key]: value })}
                full
              />
            ))
          )}
        </ProgramCard>
      ))}
    </div>
  );
}

function NonCompletionSections({ summary, invalid }: { summary: SurveySummary; invalid: boolean }) {
  return (
    <div className="participant-stack">
      {summary.draft.nonCompletions.map((item, index) => (
        <NonCompletionCard
          key={`non-completion-${index}`}
          item={item}
          index={index}
          invalid={invalid}
          onProvider={(value) => setProvider(summary, value)}
          onProgram={(value) => summary.changeProgram(index, value)}
          onCount={(value) => summary.updateProgramRecord("nonCompletions", index, { didNotComplete: value })}
          onSkip={() => summary.toggleNonCompletionSkip(index)}
          onReason={(key, value) => summary.updateNonCompletionReason(index, key, value)}
          mark={reviewMark(summary, `eda.reason-for-non-completion.${index}`)}
        />
      ))}
    </div>
  );
}

function NonCompletionCard({
  item,
  index,
  invalid,
  onProvider,
  onProgram,
  onCount,
  onSkip,
  onReason,
  mark,
}: {
  item: NonCompletionProgram;
  index: number;
  invalid: boolean;
  onProvider: (value: string) => void;
  onProgram: (value: string) => void;
  onCount: (value: string) => void;
  onSkip: () => void;
  onReason: (key: Parameters<SurveySummary["updateNonCompletionReason"]>[1], value: string) => void;
  mark?: "good" | "bad";
}) {
  const otherCount = Number(item.reasons.other);
  return (
    <ProgramCard title={programTitle(item.trainingProgram, index)} invalid={invalid && !isEdaProgramSectionValid("reason-for-non-completion", item)} mark={mark}>
      <ProviderProgramFields provider={item.trainingProvider} program={item.trainingProgram} invalid={invalid} onProvider={onProvider} onProgram={onProgram} />
      <NumberField
        label="How many GJC participants did not complete training in the program?"
        required
        value={item.didNotComplete}
        invalid={invalid && item.didNotComplete === ""}
        onChange={onCount}
        full
      />
      <fieldset className="field full reason-block subfield-group">
        <legend>What was the reason for non-completion?</legend>
        <label className="check-option no-participants skip-section">
          <input type="checkbox" checked={item.skipReasons} onChange={onSkip} />
          Check box and skip section if there are no participants to report in the quarter
        </label>
        {item.skipReasons ? (
          <p className="helper">Reason counts are hidden while this box is checked.</p>
        ) : (
          <div className="reason-list">
            {NON_COMPLETION_REASON_FIELDS.map((field) => (
              <NumberField
                key={field.key}
                label={field.label}
                required
                value={item.reasons[field.key]}
                helper="# of Participants"
                invalid={invalid && item.reasons[field.key] === ""}
                onChange={(value) => onReason(field.key, value)}
                full
              />
            ))}
            {otherCount > 0 ? (
              <TextField
                label="Please specify"
                required
                value={item.reasons.otherSpecify}
                helper={'Reason for non-completion if "other"'}
                invalid={invalid && !item.reasons.otherSpecify.trim()}
                onChange={(value) => onReason("otherSpecify", value)}
                full
              />
            ) : null}
          </div>
        )}
      </fieldset>
    </ProgramCard>
  );
}

function EmploymentTypeSections({ summary, invalid }: { summary: SurveySummary; invalid: boolean }) {
  return (
    <div className="participant-stack">
      {summary.draft.employmentType.map((item, index) => (
        <ProgramCard key={`employment-type-${index}`} title={programTitle(item.trainingProgram, index)} invalid={invalid && !isEdaProgramSectionValid("employment-type", item)} mark={reviewMark(summary, `eda.employment-type.${index}`)}>
          <ProviderProgramFields
            provider={item.trainingProvider}
            program={item.trainingProgram}
            invalid={invalid}
            onProvider={(value) => setProvider(summary, value)}
            onProgram={(value) => summary.changeProgram(index, value)}
          />
          <SkipCountBlock
            legend="What is the employment type?"
            skipLabel="Check box and skip section if no participants were placed into a job in the quarter"
            skipped={item.skipNoPlacements}
            hiddenMessage="Employment type counts are hidden while this box is checked."
            onSkip={() => summary.updateProgramRecord("employmentType", index, { skipNoPlacements: !item.skipNoPlacements })}
          >
            {EMPLOYMENT_TYPE_FIELDS.map((field) => (
              <NumberField
                key={field.key}
                label={field.label}
                required
                value={item.types[field.key]}
                helper="# of Participants"
                invalid={invalid && item.types[field.key] === ""}
                onChange={(value) => summary.updateProgramRecord("employmentType", index, { types: { ...item.types, [field.key]: value } })}
                full
              />
            ))}
            {Number(item.types.other) > 0 ? (
              <TextField
                label="Please specify"
                required
                value={item.types.otherSpecify}
                helper={'Employment type if "other"'}
                invalid={invalid && !item.types.otherSpecify.trim()}
                onChange={(value) => summary.updateProgramRecord("employmentType", index, { types: { ...item.types, otherSpecify: value } })}
                full
              />
            ) : null}
          </SkipCountBlock>
        </ProgramCard>
      ))}
    </div>
  );
}

function EarnAndLearnSections({ summary, invalid }: { summary: SurveySummary; invalid: boolean }) {
  return (
    <div className="participant-stack">
      {summary.draft.earnAndLearn.map((item, index) => (
        <ProgramCard key={`earn-and-learn-${index}`} title={programTitle(item.trainingProgram, index)} invalid={invalid && !isEdaProgramSectionValid("earn-and-learn", item)} mark={reviewMark(summary, `eda.earn-and-learn.${index}`)}>
          <ProviderProgramFields
            provider={item.trainingProvider}
            program={item.trainingProgram}
            invalid={invalid}
            onProvider={(value) => setProvider(summary, value)}
            onProgram={(value) => summary.changeProgram(index, value)}
          />
          <SelectField
            label="Does your program include work-based learning opportunities as defined as on-the-job training for more than 6 weeks?"
            required
            value={item.workBasedLearning}
            options={YES_NO}
            invalid={invalid && !item.workBasedLearning}
            onChange={(value) => summary.updateProgramRecord("earnAndLearn", index, { workBasedLearning: value })}
            full
          />
          <SkipCountBlock
            legend="If Earn and Learn employment, provide the number of participants in the type of Earn and Learn model"
            skipLabel="Check box and skip section if no participants were involved in any of the listed Earn and Learn training program in the quarter"
            skipped={item.skipNoModels}
            hiddenMessage="Earn and Learn model counts are hidden while this box is checked."
            onSkip={() => summary.updateProgramRecord("earnAndLearn", index, { skipNoModels: !item.skipNoModels })}
          >
            {EARN_AND_LEARN_FIELDS.map((field) => (
              <NumberField
                key={field.key}
                label={field.label}
                required
                value={item.models[field.key]}
                helper="# of Participants"
                invalid={invalid && item.models[field.key] === ""}
                onChange={(value) => summary.updateProgramRecord("earnAndLearn", index, { models: { ...item.models, [field.key]: value } })}
                full
              />
            ))}
            {Number(item.models.other) > 0 ? (
              <TextField
                label="Please specify"
                required
                value={item.models.otherSpecify}
                helper={'Earn and Learn model if "other"'}
                invalid={invalid && !item.models.otherSpecify.trim()}
                onChange={(value) => summary.updateProgramRecord("earnAndLearn", index, { models: { ...item.models, otherSpecify: value } })}
                full
              />
            ) : null}
          </SkipCountBlock>
        </ProgramCard>
      ))}
    </div>
  );
}

function SalariesSections({ summary, invalid }: { summary: SurveySummary; invalid: boolean }) {
  return (
    <div className="participant-stack">
      {summary.draft.salaries.map((item, index) => (
        <ProgramCard key={`salaries-${index}`} title={programTitle(item.trainingProgram, index)} invalid={invalid && !isEdaProgramSectionValid("salaries-of-participants", item)} mark={reviewMark(summary, `eda.salaries-of-participants.${index}`)}>
          <ProviderProgramFields
            provider={item.trainingProvider}
            program={item.trainingProgram}
            invalid={invalid}
            onProvider={(value) => setProvider(summary, value)}
            onProgram={(value) => summary.changeProgram(index, value)}
          />
          <SkipCountBlock
            legend="Salaries of placed participants"
            skipLabel="Check box and skip section if there are no salaries to report in the quarter"
            skipped={item.skipNoSalaries}
            hiddenMessage="Salary fields are hidden while this box is checked."
            onSkip={() => summary.updateProgramRecord("salaries", index, { skipNoSalaries: !item.skipNoSalaries })}
          >
            {SALARIES_FIELDS.map((field) => (
              <NumberField
                key={field.key}
                label={field.label}
                required
                currency
                value={item.medians[field.key]}
                helper={SALARY_MEDIAN_HELPER}
                invalid={invalid && item.medians[field.key] === ""}
                onChange={(value) => summary.updateProgramRecord("salaries", index, { medians: { ...item.medians, [field.key]: value } })}
                full
              />
            ))}
            {Number(item.medians.other) > 0 ? (
              <TextField
                label="Please specify"
                required
                value={item.medians.otherSpecify}
                helper={'Salary category if "other"'}
                invalid={invalid && !item.medians.otherSpecify.trim()}
                onChange={(value) => summary.updateProgramRecord("salaries", index, { medians: { ...item.medians, otherSpecify: value } })}
                full
              />
            ) : null}
          </SkipCountBlock>
          <NumberField
            label="What percent of employed participants reported their salaries?"
            required={!item.skipNoSalaries}
            value={item.reportedPercent}
            helper="(Example: 60%)"
            invalid={invalid && !item.skipNoSalaries && item.reportedPercent.trim() === ""}
            onChange={(value) => summary.updateProgramRecord("salaries", index, { reportedPercent: value })}
            full
          />
        </ProgramCard>
      ))}
    </div>
  );
}

function EmploymentStatusSections({ summary, invalid }: { summary: SurveySummary; invalid: boolean }) {
  return (
    <div className="participant-stack">
      {summary.draft.employmentStatus.map((item, index) => (
        <ProgramCard key={`employment-status-${index}`} title={programTitle(item.trainingProgram, index)} invalid={invalid && !isEdaProgramSectionValid("employment-status-6-months", item)} mark={reviewMark(summary, `eda.employment-status-6-months.${index}`)}>
          <ProviderProgramFields
            provider={item.trainingProvider}
            program={item.trainingProgram}
            invalid={invalid}
            onProvider={(value) => setProvider(summary, value)}
            onProgram={(value) => summary.changeProgram(index, value)}
          />
          <SkipCountBlock
            legend="What is the employment status of Good Jobs Challenge-funded participants after SIX months of program completion?"
            skipLabel="Check box and skip section if there are no participants to report after six months"
            skipped={item.skipNoStatus}
            hiddenMessage="Six-month status counts are hidden while this box is checked."
            onSkip={() => summary.updateProgramRecord("employmentStatus", index, { skipNoStatus: !item.skipNoStatus })}
          >
            {EMPLOYMENT_STATUS_FIELDS.map((field) => (
              <NumberField
                key={field.key}
                label={field.label}
                required
                value={item.statuses[field.key]}
                helper="# of Participants"
                invalid={invalid && item.statuses[field.key] === ""}
                onChange={(value) => summary.updateProgramRecord("employmentStatus", index, { statuses: { ...item.statuses, [field.key]: value } })}
                full
              />
            ))}
          </SkipCountBlock>
          <TextField
            label="List the top three job occupations placed GJC participants are employed in after SIX months."
            required={!item.skipNoStatus}
            value={item.topOccupations}
            helperNode={<NaicsHelper />}
            invalid={invalid && !item.skipNoStatus && !item.topOccupations.trim()}
            onChange={(value) => summary.updateProgramRecord("employmentStatus", index, { topOccupations: value })}
            full
          />
          <TextField
            label="List the top three employers of Good Jobs Challenge-funded participants are employed with after SIX months."
            required={!item.skipNoStatus}
            value={item.topEmployers}
            invalid={invalid && !item.skipNoStatus && !item.topEmployers.trim()}
            onChange={(value) => summary.updateProgramRecord("employmentStatus", index, { topEmployers: value })}
            full
          />
        </ProgramCard>
      ))}
    </div>
  );
}

function SkipCountBlock({
  legend,
  skipLabel,
  skipped,
  hiddenMessage,
  onSkip,
  children,
}: {
  legend: string;
  skipLabel: string;
  skipped: boolean;
  hiddenMessage: string;
  onSkip: () => void;
  children: ReactNode;
}) {
  return (
    <fieldset className="field full reason-block subfield-group">
      <legend>{legend}</legend>
      <label className="check-option no-participants skip-section">
        <input type="checkbox" checked={skipped} onChange={onSkip} />
        {skipLabel}
      </label>
      {skipped ? <p className="helper">{hiddenMessage}</p> : <div className="reason-list">{children}</div>}
    </fieldset>
  );
}

function NaicsHelper() {
  return (
    <span className="helper">
      Please use NAICS codes of the occupation, if possible. (
      <a className="external-link" href={NAICS_URL} target="_blank" rel="noopener noreferrer">
        {NAICS_URL}
        <span className="external-link-icon" aria-hidden="true">
          ↗
        </span>
        <span className="sr-only">(opens in a new tab)</span>
      </a>
      )
    </span>
  );
}

function ParticipantDatabaseFields({
  summary,
  invalid,
}: {
  summary: SurveySummary;
  invalid: boolean;
}) {
  const { draft } = summary;
  return (
    <div>
      <label className="check-option no-participants">
        <input type="checkbox" checked={draft.noParticipants} onChange={summary.toggleNoParticipants} />
        There are no participants to register in this form
      </label>
      {draft.noParticipants ? (
        <p className="helper">Participant fields are hidden while this box is checked.</p>
      ) : (
        <div className="participant-stack">
          {draft.participants.map((person, index) => (
            <ParticipantCard
              key={`participant-${index}`}
              person={person}
              index={index}
              programOptions={summary.programOptions}
              invalid={invalid}
              canRemove={draft.participants.length > 1}
              mark={reviewMark(summary, draft.noParticipants ? "eda.participant-database.none" : `eda.participant-database.${index}`)}
              onChange={(patch) => summary.updateParticipant(index, patch)}
              onDate={(field, part, value) => summary.updateParticipantDate(index, field, part, value)}
              onRemove={() => summary.removeParticipant(index)}
            />
          ))}
          <button type="button" className="add-program" onClick={summary.addParticipant}>
            + Add participant
          </button>
        </div>
      )}
    </div>
  );
}

function ParticipantCard({
  person,
  index,
  programOptions,
  invalid,
  canRemove,
  mark,
  onChange,
  onDate,
  onRemove,
}: {
  person: EdaParticipant;
  index: number;
  programOptions: string[];
  invalid: boolean;
  canRemove: boolean;
  mark?: "good" | "bad";
  onChange: (patch: Partial<EdaParticipant>) => void;
  onDate: (field: "trainingStart" | "trainingEnd" | "jobStart" | "dateOfBirth", part: keyof SplitDate, value: string) => void;
  onRemove: () => void;
}) {
  const endRequired = person.completedTraining === "Yes";
  return (
    <Panel className={formCardClass(invalid && !isParticipantValid(person))}>
      <div className="participant-card-head">
        <h3>Participant {index + 1}</h3>
        {mark ? <FieldMarks mark={mark} /> : null}
        {canRemove ? (
          <button type="button" className="btn ghost" onClick={onRemove}>
            Remove
          </button>
        ) : null}
      </div>
      <div className="fields">
        <div className="field-group">
          <TextField label="Training Provider" required value={person.trainingProvider} invalid={invalid && !person.trainingProvider} onChange={(value) => onChange({ trainingProvider: value })} />
          <div className="field">
            <label>
              Training Program <span className="req">*</span>
            </label>
            <select
              value={person.trainingProgram}
              className={invalid && !person.trainingProgram ? "invalid" : undefined}
              onChange={(event) => onChange({ trainingProgram: event.target.value })}
            >
              <option value="">Select…</option>
              {programOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <TextField label="First Name" required value={person.firstName} invalid={invalid && !person.firstName} onChange={(value) => onChange({ firstName: value })} />
          <TextField label="Middle Name" value={person.middleName} onChange={(value) => onChange({ middleName: value })} />
          <TextField label="Last Name" required value={person.lastName} invalid={invalid && !person.lastName} onChange={(value) => onChange({ lastName: value })} />
        </div>
        <div className="field-group">
          <DatePartsField label="Training Start Date" required value={person.trainingStart} invalid={invalid} onChange={(part, value) => onDate("trainingStart", part, value)} />
          <DatePartsField label="Training End Date" required={endRequired} value={person.trainingEnd} invalid={invalid} onChange={(part, value) => onDate("trainingEnd", part, value)} />
          <div className="field">
            <label>
              Completed Training <span className="req">*</span>
            </label>
            <select
              value={person.completedTraining}
              className={invalid && !person.completedTraining ? "invalid" : undefined}
              onChange={(event) => onChange({ completedTraining: event.target.value })}
            >
              <option value="">Select…</option>
              {YES_NO.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <DatePartsField label="Job Start Date" value={person.jobStart} onChange={(part, value) => onDate("jobStart", part, value)} />
          <DatePartsField label="Date of Birth" value={person.dateOfBirth} onChange={(part, value) => onDate("dateOfBirth", part, value)} />
        </div>
        <div className="field-group address-group">
          <span className="address-label">Address of Residence</span>
          <div className="address-streets">
            <TextField label="Street" required value={person.street} invalid={invalid && !person.street} onChange={(value) => onChange({ street: value })} />
            <TextField label="Street (apt, etc)" value={person.street2} onChange={(value) => onChange({ street2: value })} />
          </div>
          <div className="address-city-row">
            <TextField label="City" required value={person.city} invalid={invalid && !person.city} onChange={(value) => onChange({ city: value })} />
            <div className="field">
              <label>
                State <span className="req">*</span>
              </label>
              <select
                value={person.state}
                className={invalid && !person.state ? "invalid" : undefined}
                onChange={(event) => onChange({ state: event.target.value })}
              >
                <option value="">Select…</option>
                {US_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
            <div className="field field-zip">
              <label>
                Zip <span className="req">*</span>
              </label>
              <input
                value={person.zip}
                inputMode="numeric"
                maxLength={5}
                placeholder="12345"
                className={invalid && !isValidZip(person.zip) ? "invalid" : undefined}
                onChange={(event) => onChange({ zip: event.target.value.replace(/\D/g, "").slice(0, 5) })}
              />
            </div>
          </div>
          <span className="helper address-zip-helper">Enter a 5-digit ZIP code.</span>
        </div>
      </div>
    </Panel>
  );
}

function DatePartsField({
  label,
  value,
  required,
  invalid,
  onChange,
}: {
  label: string;
  value: SplitDate;
  required?: boolean;
  invalid?: boolean;
  onChange: (part: keyof SplitDate, value: string) => void;
}) {
  const missing = Boolean(required && invalid && (!value.month || !value.day || !value.year));
  return (
    <fieldset className="field full date-parts field-date">
      <legend>
        {label}
        {required ? <span className="req"> *</span> : null}
      </legend>
      <div className="date-parts-grid">
        <label>
          Month
          <select value={value.month} className={missing && !value.month ? "invalid" : undefined} onChange={(event) => onChange("month", event.target.value)}>
            <option value="">Month</option>
            {DATE_MONTHS.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Day
          <input
            type="number"
            min={1}
            max={31}
            inputMode="numeric"
            value={value.day}
            className={missing && !value.day ? "invalid" : undefined}
            onChange={(event) => onChange("day", event.target.value)}
          />
        </label>
        <label>
          Year
          <input
            type="number"
            min={1950}
            max={2040}
            inputMode="numeric"
            value={value.year}
            className={missing && !value.year ? "invalid" : undefined}
            onChange={(event) => onChange("year", event.target.value)}
          />
        </label>
      </div>
    </fieldset>
  );
}

function TextField({
  label,
  value,
  required,
  invalid,
  helper,
  helperNode,
  full,
  onChange,
}: {
  label: string;
  value: string;
  required?: boolean;
  invalid?: boolean;
  helper?: string;
  helperNode?: ReactNode;
  full?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className={`field${full ? " full" : ""}`}>
      <label>
        {label}
        {required ? <span className="req"> *</span> : null}
      </label>
      <input value={value} className={invalid ? "invalid" : undefined} onChange={(event) => onChange(event.target.value)} />
      {helperNode ?? (helper ? <span className="helper">{helper}</span> : null)}
    </div>
  );
}

function NumberField({
  label,
  value,
  required,
  invalid,
  helper,
  full,
  currency,
  onChange,
}: {
  label: string;
  value: string;
  required?: boolean;
  invalid?: boolean;
  helper?: string;
  full?: boolean;
  currency?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className={`field field-numeric${full ? " full" : ""}`}>
      <label>
        {label}
        {required ? <span className="req"> *</span> : null}
      </label>
      <div className={currency ? "currency-input" : undefined}>
        {currency ? <span className="currency-prefix">$</span> : null}
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step={currency ? "0.01" : "any"}
          value={value}
          className={invalid ? "invalid" : undefined}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      {helper ? <span className="helper">{helper}</span> : null}
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  required,
  invalid,
  full,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  required?: boolean;
  invalid?: boolean;
  full?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className={`field${full ? " full" : ""}`}>
      <label>
        {label}
        {required ? <span className="req"> *</span> : null}
      </label>
      <select value={value} className={invalid ? "invalid" : undefined} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select…</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function EdaFieldInput({
  field,
  value,
  invalid,
  onChange,
  mark,
}: {
  field: EdaField;
  value: string;
  invalid: boolean;
  onChange: ReturnType<typeof useEdaSurvey>["change"];
  mark?: "good" | "bad";
}) {
  const id = `eda-${field.key}`;
  return (
    <div className={`field${field.full ? " full" : ""}${field.type === "number" ? " field-numeric" : ""}`}>
      <label htmlFor={id}>
        {field.label}
        {field.required ? <span className="req"> *</span> : null}
        {mark ? <FieldMarks mark={mark} /> : null}
      </label>
      {field.type === "select" ? (
        <select id={id} name={field.key} value={value} className={invalid ? "invalid" : undefined} onChange={onChange}>
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
