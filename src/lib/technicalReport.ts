import { EMPLOYMENT_TYPE_FIELDS } from "@/constants/eda";
import type {
  AchievementRow,
  ChallengeRow,
  IntakeDraft,
  KeywordRow,
  MediaLinkRow,
  PlanRow,
  TestimonialFile,
  TestimonialSection,
} from "@/types/domain";
import type { CompletionProgram, EdaSurveyDraft, EmploymentTypeProgram } from "@/types/submissions";

export const CHALLENGE_KEYWORDS = ["Enrollment", "Staffing", "Retention", "Funding", "Data Collection", "None"] as const;
export const ACHIEVEMENT_KEYWORDS = [
  "Job placement",
  "Training completion",
  "New employer partnership",
  "Braided funding secured",
  "None",
] as const;
export const ADD_KEYWORD = "Add keyword…";

export const NONE_CHALLENGE = "None";
export const NONE_ACHIEVEMENT = "None";

function hasText(value: string | undefined): boolean {
  return Boolean(value?.trim());
}

function count(value: string | undefined): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

export function emptyKeywordRow(keyword: string): KeywordRow {
  const none = keyword === NONE_CHALLENGE || keyword === NONE_ACHIEVEMENT;
  return { keyword, detail: none ? "None" : "" };
}

export function emptyChallengeRow(): ChallengeRow {
  return emptyKeywordRow(NONE_CHALLENGE);
}

export function emptyAchievementRow(): AchievementRow {
  return emptyKeywordRow(NONE_ACHIEVEMENT);
}

export function emptyPlanRow(): PlanRow {
  return { plan: "None", potentialGain: "None" };
}

export function emptyTestimonial(): TestimonialSection {
  return { available: "None", detail: "None", files: [] };
}

export function emptyMediaLinkRow(): MediaLinkRow {
  return { available: "None", detail: "None" };
}

export function defaultIntakeDraft(): IntakeDraft {
  return {
    challenges: [emptyChallengeRow()],
    challengeKeywords: [...CHALLENGE_KEYWORDS],
    plans: [emptyPlanRow()],
    achievements: [emptyAchievementRow()],
    achievementKeywords: [...ACHIEVEMENT_KEYWORDS],
    testimonial: emptyTestimonial(),
    mediaLink: emptyMediaLinkRow(),
  };
}

export function fileFromBrowser(file: File, dataUrl?: string): TestimonialFile {
  return { name: file.name, size: file.size, type: file.type, dataUrl };
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

export function attachmentHref(file: TestimonialFile): string {
  if (file.dataUrl) return file.dataUrl;
  const payload = btoa(`Demo attachment: ${file.name}`);
  return `data:${file.type || "text/plain"};base64,${payload}`;
}

export function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function keywordOptions(keywords: string[]): string[] {
  return [...keywords, ADD_KEYWORD];
}

export function addCustomKeyword(keywords: string[], value: string, noneLabel: string): string[] {
  const next = value.trim();
  if (!next || keywords.some((item) => item.toLowerCase() === next.toLowerCase())) return keywords;
  return [...keywords.filter((item) => item !== noneLabel), next, noneLabel];
}

function completionSentence(item: CompletionProgram): string | null {
  if (item.skipNoCompletions || count(item.completed) === 0) return null;
  const program = item.trainingProgram.trim() || "training";
  return `${item.completed} participants completed the ${program} program; ${item.completedOnTime} completed training on time.`;
}

function placementSentence(item: EmploymentTypeProgram): string | null {
  if (item.skipNoPlacements) return null;
  const parts = EMPLOYMENT_TYPE_FIELDS.map((field) => {
    const value = count(item.types[field.key]);
    return value > 0 ? `${value} ${field.label.replace(" employment", "").toLowerCase()}` : null;
  }).filter((part): part is string => Boolean(part));
  const total = EMPLOYMENT_TYPE_FIELDS.reduce((sum, field) => sum + count(item.types[field.key]), 0);
  if (total === 0) return null;
  const program = item.trainingProgram.trim() || "training";
  return `${total} participants from the ${program} program were placed into employment (${parts.join(", ")}).`;
}

function uniqueEmployers(draft: EdaSurveyDraft): string[] {
  const names = draft.employmentStatus.flatMap((item) => {
    if (item.skipNoStatus || !hasText(item.topEmployers)) return [];
    return item.topEmployers.split(/[,;]/).map((name) => name.trim()).filter(Boolean);
  });
  return Array.from(new Set(names));
}

export function achievementTextForKeyword(keyword: string, eda: EdaSurveyDraft): string {
  if (keyword === NONE_ACHIEVEMENT) return "None";
  if (keyword === "Training completion") {
    return eda.completions.map(completionSentence).filter((line): line is string => Boolean(line)).join(" ");
  }
  if (keyword === "Job placement") {
    return eda.employmentType.map(placementSentence).filter((line): line is string => Boolean(line)).join(" ");
  }
  if (keyword === "New employer partnership") {
    const employers = uniqueEmployers(eda);
    return employers.length ? `Top employers reported this period: ${employers.join(", ")}.` : "";
  }
  return "";
}

export function suggestedAchievementRows(eda: EdaSurveyDraft): AchievementRow[] {
  const rows: AchievementRow[] = [];
  for (const keyword of ["Training completion", "Job placement", "New employer partnership"] as const) {
    const detail = achievementTextForKeyword(keyword, eda);
    if (detail) rows.push({ keyword, detail });
  }
  return rows.length > 0 ? rows : [emptyAchievementRow()];
}

export function isDefaultAchievements(rows: AchievementRow[]): boolean {
  return rows.length === 1 && rows[0].keyword === NONE_ACHIEVEMENT && rows[0].detail.trim() === "None";
}

export function applyTechnicalDefaults(draft: IntakeDraft, eda: EdaSurveyDraft): Partial<IntakeDraft> {
  if (!isDefaultAchievements(draft.achievements)) return {};
  const suggested = suggestedAchievementRows(eda);
  if (suggested.length === 1 && suggested[0].keyword === NONE_ACHIEVEMENT) return {};
  return { achievements: suggested };
}

function keywordLine(row: KeywordRow): string {
  if (row.keyword === NONE_CHALLENGE || row.keyword === NONE_ACHIEVEMENT) return row.detail.trim() || "None";
  if (!hasText(row.detail) || row.detail.trim() === row.keyword) return row.keyword;
  return `${row.keyword}: ${row.detail.trim()}`;
}

export function technicalNarratives(draft: IntakeDraft): { achievements: string; challenges: string; plan: string; story: string } {
  return {
    achievements: draft.achievements.map(keywordLine).join(" "),
    challenges: draft.challenges.map(keywordLine).join(" "),
    plan: draft.plans
      .map((row, index) => {
        if (row.plan.trim() === "None" && row.potentialGain.trim() === "None") return "None";
        return `${index + 1}. ${row.plan}${hasText(row.potentialGain) && row.potentialGain !== "None" ? ` (Potential performance gain: ${row.potentialGain})` : ""}`;
      })
      .join(" "),
    story: [
      draft.testimonial.available === "None"
        ? "None"
        : draft.testimonial.files.filter((file): file is TestimonialFile => Boolean(file)).map((file) => file.name).join(", ") || "Yes",
      draft.mediaLink.available === "None" ? "None" : draft.mediaLink.detail.trim() || "Yes",
    ].join(" "),
  };
}

function keywordRowsValid(rows: KeywordRow[], noneKeyword: string): boolean {
  if (rows.length === 0) return false;
  return rows.every((row) => {
    if (!hasText(row.keyword) || row.keyword === ADD_KEYWORD) return false;
    if (row.keyword === noneKeyword) return row.detail.trim() === "None" || hasText(row.detail);
    return hasText(row.detail);
  });
}

function plansValid(rows: PlanRow[]): boolean {
  if (rows.length === 0) return false;
  return rows.every((row) => hasText(row.plan));
}

function testimonialValid(section: TestimonialSection): boolean {
  if (section.available === "None") return true;
  return section.files.some((file) => Boolean(file?.name));
}

function mediaLinkValid(row: MediaLinkRow): boolean {
  if (row.available === "None") return true;
  return hasText(row.detail);
}

export function isTechnicalDraftValid(draft: IntakeDraft): boolean {
  return (
    keywordRowsValid(draft.challenges, NONE_CHALLENGE) &&
    plansValid(draft.plans) &&
    keywordRowsValid(draft.achievements, NONE_ACHIEVEMENT) &&
    testimonialValid(draft.testimonial) &&
    mediaLinkValid(draft.mediaLink)
  );
}

export function technicalHasStarted(draft: IntakeDraft): boolean {
  return (
    draft.challenges.some((row) => row.keyword !== NONE_CHALLENGE || row.detail.trim() !== "None") ||
    draft.plans.some((row) => row.plan.trim() !== "None" || row.potentialGain.trim() !== "None") ||
    draft.achievements.some((row) => row.keyword !== NONE_ACHIEVEMENT || row.detail.trim() !== "None") ||
    draft.testimonial.available !== "None" ||
    draft.testimonial.files.some(Boolean) ||
    draft.mediaLink.available !== "None" ||
    draft.mediaLink.detail.trim() !== "None"
  );
}

export function filledTechnicalDraft(): IntakeDraft {
  return {
    challengeKeywords: [...CHALLENGE_KEYWORDS],
    achievementKeywords: [...ACHIEVEMENT_KEYWORDS],
    challenges: [{ keyword: "Enrollment", detail: "Two evening sections ran below capacity after a plant schedule change." }],
    plans: [
      {
        plan: "Move one section to a weekend format and add employer-referred seats.",
        potentialGain: "Recover evening-section capacity and increase employer-referred enrollment.",
      },
    ],
    achievements: [emptyAchievementRow()],
    testimonial: {
      available: "Yes",
      detail: "",
      files: [{
        name: "EDA-success-story-july.pdf",
        size: 182400,
        type: "application/pdf",
        dataUrl: `data:text/plain;base64,${btoa("Demo attachment: EDA-success-story-july.pdf")}`,
      }],
    },
    mediaLink: {
      available: "Yes",
      detail: "Short clip of a participant moving from temporary work into a full-time machining role.",
    },
  };
}
