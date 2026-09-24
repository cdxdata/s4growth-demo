import { useState, type ChangeEvent, type ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { FieldMarks } from "@/components/ui/FieldMarks";
import { Panel } from "@/components/ui/Panel";
import { useIntake } from "@/features/intake/useIntake";
import { ADD_KEYWORD, keywordOptions } from "@/lib/technicalReport";
import type { KeywordRow, TestimonialFile } from "@/types/domain";

export function IntakePage() {
  const summary = useIntake();
  const challengeInvalid = summary.showErrors && summary.form.challenges.some((row) => !row.keyword || (row.keyword !== "None" && !row.detail.trim()));
  const planInvalid = summary.showErrors && summary.form.plans.some((row) => !row.plan.trim());
  const achievementInvalid = summary.showErrors && summary.form.achievements.some((row) => !row.keyword || (row.keyword !== "None" && !row.detail.trim()));
  const testimonialInvalid = summary.showErrors && summary.form.testimonial.available === "Yes" && !summary.form.testimonial.files.some((file) => Boolean(file?.name));
  const mediaInvalid = summary.showErrors && summary.form.mediaLink.available === "Yes" && !summary.form.mediaLink.detail.trim();

  return (
    <>
      <Header title="Monthly technical report" subtitle={`${summary.monthLabel} · ${summary.organizationName}`} hidePeriod />
      <div className="form-wrap eda-wrap">
        <button type="button" className="back" onClick={summary.goBack}>
          {summary.isTrainingProvider ? "← Monthly Submissions" : "← Subawardee"}
        </button>
        {summary.error ? <div className="notice error">{summary.error}</div> : null}

        <Section num="01">
          <button type="button" className={`tech-eda-badge${summary.edaFilled ? " is-filled" : " is-missing"}`} onClick={summary.goEda}>
            <span className="tech-eda-badge-icon" aria-hidden="true">
              {summary.edaFilled ? "✓" : "!"}
            </span>
            {summary.edaFilled ? "EDA Survey form filled" : "EDA Survey form not filled"}
          </button>
        </Section>

        <Section num="02" title="Challenges this month" invalid={challengeInvalid} mark={summary.showMarks ? summary.fieldMarks["technical.challenges"] : undefined}>
          {summary.form.challenges.map((row, index) => (
            <KeywordRowFields
              key={`challenge-${index}`}
              row={row}
              keywords={summary.form.challengeKeywords}
              invalid={challengeInvalid}
              canRemove={summary.form.challenges.length > 1}
              onChange={(patch) => summary.updateChallenge(index, patch)}
              detailPlaceholder={row.keyword !== "None" ? `Briefly explain the ${row.keyword} challenge` : undefined}
              onAddKeyword={(value) => summary.addChallengeKeyword(index, value)}
              onRemove={() => summary.removeChallenge(index)}
            />
          ))}
          <button type="button" className="add-program" onClick={summary.addChallenge}>
            + Add challenge
          </button>
        </Section>

        <Section num="03" title="Plan to address the challenges listed in 02" invalid={planInvalid} mark={summary.showMarks ? summary.fieldMarks["technical.plans"] : undefined}>
          <div className="tech-plan-table-wrap">
            <table className="tech-plan-table">
              <thead>
                <tr>
                  <th className="tech-plan-sn">S/N</th>
                  <th>Plan</th>
                  <th>Potential Performance Gain</th>
                  <th className="tech-plan-action">
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {summary.form.plans.map((row, index) => (
                  <tr key={`plan-${index}`}>
                    <td className="tech-plan-sn">{index + 1}</td>
                    <td>
                      <input
                        value={row.plan}
                        className={planInvalid && !row.plan.trim() ? "invalid" : undefined}
                        onChange={(event) => summary.updatePlan(index, { plan: event.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        value={row.potentialGain}
                        placeholder={row.plan.trim() !== "None" ? "Briefly explain how the new plan helps" : undefined}
                        onChange={(event) => summary.updatePlan(index, { potentialGain: event.target.value })}
                      />
                    </td>
                    <td className="tech-plan-action">
                      {summary.form.plans.length > 1 ? (
                        <button type="button" className="btn ghost" onClick={() => summary.removePlan(index)}>
                          Remove
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button type="button" className="add-program" onClick={summary.addPlan}>
            + Add plan
          </button>
        </Section>

        <Section num="04" title="This month's achievement" invalid={achievementInvalid} mark={summary.showMarks ? summary.fieldMarks["technical.achievements"] : undefined}>
          {summary.form.achievements.map((row, index) => (
            <KeywordRowFields
              key={`achievement-${index}`}
              row={row}
              keywords={summary.form.achievementKeywords}
              invalid={achievementInvalid}
              canRemove={summary.form.achievements.length > 1}
              onChange={(patch) => summary.updateAchievement(index, patch)}
              onAddKeyword={(value) => summary.addAchievementKeyword(index, value)}
              onRemove={() => summary.removeAchievement(index)}
            />
          ))}
          <button type="button" className="add-program" onClick={summary.addAchievement}>
            + Add achievement
          </button>
        </Section>

        <Section num="05" title="Participant testimonial available?" invalid={testimonialInvalid} mark={summary.showMarks ? summary.fieldMarks["technical.testimonial"] : undefined}>
          <div className="tech-keyword-row">
            <div className="field">
              <label>Available</label>
              <select
                value={summary.form.testimonial.available}
                onChange={(event) => summary.updateTestimonial({ available: event.target.value as "None" | "Yes" })}
              >
                <option value="None">None</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            {summary.form.testimonial.available === "None" ? (
              <div className="field">
                <label>Detail</label>
                <input value={summary.form.testimonial.detail} readOnly />
              </div>
            ) : (
              <div className="tech-testimonial-files">
                {summary.form.testimonial.files.map((file, index) => (
                  <div key={`testimonial-file-${index}`} className="tech-file-slot">
                    <FileField
                      label="EDA success story template"
                      helper="Attach a filled EDA success story template."
                      accept=".pdf,.doc,.docx,.txt"
                      file={file ?? undefined}
                      invalid={testimonialInvalid && !file?.name}
                      onChange={(next) => summary.attachTestimonial(index, next)}
                    />
                    {summary.form.testimonial.files.length > 1 ? (
                      <button type="button" className="btn ghost" onClick={() => summary.removeTestimonialFile(index)}>
                        Remove
                      </button>
                    ) : null}
                  </div>
                ))}
                <button type="button" className="add-program" onClick={summary.addTestimonialFile}>
                  + Add testimonial
                </button>
              </div>
            )}
          </div>
        </Section>

        <Section num="06" title="Photo/video/article link" invalid={mediaInvalid} mark={summary.showMarks ? summary.fieldMarks["technical.mediaLink"] : undefined}>
          <div className="tech-keyword-row">
            <div className="field">
              <label>Available</label>
              <select
                value={summary.form.mediaLink.available}
                onChange={(event) => summary.updateMediaLink({ available: event.target.value as "None" | "Yes" })}
              >
                <option value="None">None</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
            {summary.form.mediaLink.available === "None" ? (
              <div className="field">
                <label>Detail</label>
                <input value={summary.form.mediaLink.detail} readOnly />
              </div>
            ) : (
              <div className="field">
                <label>Detail</label>
                <textarea
                  value={summary.form.mediaLink.detail}
                  className={mediaInvalid ? "invalid" : undefined}
                  onChange={(event) => summary.updateMediaLink({ detail: event.target.value })}
                />
                <span className="helper">
                  Provide any photos, video interview links, or media article links from your area or sector collected or seen this month.
                </span>
              </div>
            )}
          </div>
        </Section>

        <div className="form-foot">
          <button type="button" className="btn secondary" onClick={summary.saveDraft}>
            Save Submission
          </button>
          {summary.isTrainingProvider ? null : (
            <button type="button" className="btn primary" onClick={summary.submit} disabled={summary.isSubmitting}>
              {summary.isSubmitting ? "Submitting…" : "Submit for review →"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

function Section({
  num,
  title,
  children,
  invalid,
  mark,
}: {
  num: string;
  title?: string;
  children: ReactNode;
  invalid?: boolean;
  mark?: "good" | "bad";
}) {
  return (
    <Panel className={`eda-form-card tech-section${invalid ? " is-invalid" : ""}${mark === "bad" ? " is-flagged" : ""}`}>
      <div className="section-title">
        <div className="num">{num}</div>
        {title ? <h2>{title}</h2> : null}
        {mark ? <FieldMarks mark={mark} /> : null}
      </div>
      {children}
    </Panel>
  );
}

function KeywordRowFields({
  row,
  keywords,
  invalid,
  canRemove,
  detailPlaceholder,
  onChange,
  onAddKeyword,
  onRemove,
}: {
  row: KeywordRow;
  keywords: string[];
  invalid: boolean;
  canRemove: boolean;
  detailPlaceholder?: string;
  onChange: (patch: Partial<KeywordRow>) => void;
  onAddKeyword: (value: string) => void;
  onRemove: () => void;
}) {
  const [custom, setCustom] = useState("");
  const adding = row.keyword === ADD_KEYWORD;
  const none = row.keyword === "None";
  const missing = invalid && !none && !row.detail.trim();

  function commitKeyword() {
    if (!custom.trim()) return;
    onAddKeyword(custom);
    setCustom("");
  }

  return (
    <div className="tech-keyword-row">
      <div className="field">
        <label>Keyword</label>
        <select value={row.keyword} onChange={(event) => onChange({ keyword: event.target.value })}>
          {keywordOptions(keywords).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {adding ? (
          <div className="tech-add-keyword">
            <input
              value={custom}
              placeholder="New keyword"
              onChange={(event) => setCustom(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  commitKeyword();
                }
              }}
            />
            <button type="button" className="btn secondary" onClick={commitKeyword} disabled={!custom.trim()}>
              Add
            </button>
          </div>
        ) : null}
      </div>
      <div className="field">
        <label>Detail</label>
        <textarea
          value={row.detail}
          readOnly={none}
          placeholder={none ? undefined : detailPlaceholder}
          className={missing ? "invalid" : undefined}
          onChange={(event) => onChange({ detail: event.target.value })}
        />
      </div>
      {canRemove ? (
        <button type="button" className="btn ghost tech-row-remove" onClick={onRemove}>
          Remove
        </button>
      ) : null}
    </div>
  );
}

function FileField({
  label,
  helper,
  accept,
  file,
  invalid,
  onChange,
}: {
  label: string;
  helper: string;
  accept: string;
  file?: TestimonialFile;
  invalid?: boolean;
  onChange: (file: File | undefined) => void;
}) {
  function pick(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.files?.[0]);
  }

  return (
    <div className={`field${invalid ? " invalid-group" : ""}`}>
      <label>{label}</label>
      <input type="file" accept={accept} className={invalid ? "invalid" : undefined} onChange={pick} />
      {file ? <span className="tech-file-name">{file.name}</span> : null}
      <span className="helper">{helper}</span>
    </div>
  );
}
