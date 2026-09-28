import { programsForOrganization } from "@/constants/directorySeed";
import { SECTORAL_PARTNERSHIPS, emptyEdaDraft, emptyInvoiceDraft } from "@/constants/eda";
import { TRAINING_PROVIDERS, type TrainingProviderOrg } from "@/constants/organizations";
import { MONTH_NAMES, getPeriodById, getPeriodDueIso } from "@/constants/periods";
import {
  emptyAdmissions,
  emptyCompletion,
  emptyEarnAndLearn,
  emptyEarnAndLearnModels,
  emptyEmploymentStatus,
  emptyEmploymentStatuses,
  emptyEmploymentType,
  emptyEmploymentTypes,
  emptyInstitutional,
  emptyNonCompletion,
  emptyReasons,
  emptySalaries,
  emptySalaryMedians,
} from "@/lib/edaProgramRecords";
import { addDays } from "@/lib/reportingDates";
import {
  emptyEdaSections,
  emptyPackageReview,
  normalizePackageReview,
  reviewSignature,
  reviewValueSnapshot,
} from "@/lib/reviewModel";
import { ACHIEVEMENT_KEYWORDS, CHALLENGE_KEYWORDS, applyTechnicalDefaults, defaultIntakeDraft, filledTechnicalDraft } from "@/lib/technicalReport";
import type { IntakeDraft, SubmissionStatus } from "@/types/domain";
import type {
  EdaParticipant,
  EdaSurveyDraft,
  PackageReview,
  PeriodSubmissionRecord,
  ProviderPeriodStatus,
  ReviewMail,
} from "@/types/submissions";

export type DemoSubmissionsState = {
  version: number;
  byProvider: Record<string, Record<string, PeriodSubmissionRecord>>;
  providerStatus: Record<string, Record<string, ProviderPeriodStatus>>;
  mail: ReviewMail[];
};

export const SUBMISSIONS_STORAGE_KEY = "s4g-monthly-submissions";
export const SUBMISSIONS_STORAGE_VERSION = 10;
const LAST_EDA_STEP = 9;

const COMPLETE_MONTHS = ["2026-04", "2026-05", "2026-06", "2026-07", "2026-08"] as const;
const ALL_MONTHS = [...COMPLETE_MONTHS, "2026-09"] as const;

export const SEPTEMBER_STATUSES: Record<number, SubmissionStatus> = {
  1: "Missing/flagged",
  2: "Complete",
  3: "Not started",
  4: "Complete",
  5: "In review",
  6: "Awaiting review",
  7: "Complete",
  8: "Not started",
  9: "Complete",
  10: "In review",
  11: "Awaiting review",
  12: "Missing/flagged",
  13: "Complete",
  14: "Not started",
  15: "In review",
};

const FIRST_NAMES = ["Maya", "Andre", "Keisha", "Luis", "Priya", "Jonah", "Amelia", "Darius", "Naomi", "Eli"];
const LAST_NAMES = ["Foster", "Hale", "Nguyen", "Brooks", "Patel", "Ortiz", "Cole", "Ward", "Simmons", "Reed"];
const CITIES = ["Burlington", "Greensboro", "Durham", "Raleigh", "Fayetteville", "Wilmington", "Asheville", "Charlotte", "Rocky Mount", "Hickory"];

function hash(value: string): number {
  let next = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    next = Math.imul(next ^ value.charCodeAt(index), 16777619);
  }
  return next >>> 0;
}

function rng(seed: string): () => number {
  let state = hash(seed) || 1;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function pick<T>(list: readonly T[], rand: () => number): T {
  return list[Math.floor(rand() * list.length)] ?? list[0];
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function count(rand: () => number, min: number, max: number): string {
  return String(min + Math.floor(rand() * (max - min + 1)));
}

function money(rand: () => number, min: number, max: number): string {
  return String(min + Math.floor(rand() * (max - min + 1)));
}

function wage(rand: () => number, min: number, max: number): string {
  return (min + rand() * (max - min)).toFixed(2);
}

function partnershipFor(backbone: string | null): string {
  if (backbone?.includes("Piedmont-Triad")) return SECTORAL_PARTNERSHIPS[0];
  if (backbone?.includes("Capital Area")) return SECTORAL_PARTNERSHIPS[1];
  if (backbone?.includes("Eastern")) return SECTORAL_PARTNERSHIPS[2];
  if (backbone?.includes("Western")) return SECTORAL_PARTNERSHIPS[3];
  return SECTORAL_PARTNERSHIPS[4];
}

function programsFor(org: TrainingProviderOrg): string[] {
  const listed = programsForOrganization(org.name);
  return listed.length ? listed : [org.program];
}

function participant(org: TrainingProviderOrg, program: string, periodId: string, index: number, rand: () => number): EdaParticipant {
  const period = getPeriodById(periodId);
  const month = period.month ?? 9;
  const startDay = 1 + Math.floor(rand() * 10);
  const endDay = 18 + Math.floor(rand() * 10);
  return {
    trainingProvider: org.name,
    trainingProgram: program,
    firstName: FIRST_NAMES[(hash(`${org.id}-${periodId}-${index}`) + index) % FIRST_NAMES.length],
    middleName: pick(["A", "J", "R", "M", ""], rand),
    lastName: LAST_NAMES[(hash(`${org.id}-${periodId}-last-${index}`) + index) % LAST_NAMES.length],
    trainingStart: { month: pad(month), day: pad(startDay), year: "2026" },
    trainingEnd: { month: pad(month), day: pad(endDay), year: "2026" },
    completedTraining: rand() > 0.2 ? "Yes" : "No",
    jobStart: { month: pad(Math.min(12, month + 1)), day: pad(1 + Math.floor(rand() * 12)), year: "2026" },
    dateOfBirth: { month: pad(1 + Math.floor(rand() * 12)), day: pad(1 + Math.floor(rand() * 28)), year: String(1988 + Math.floor(rand() * 18)) },
    street: `${100 + Math.floor(rand() * 800)} ${pick(["Main", "Elm", "Church", "Market", "Pine"], rand)} Street`,
    street2: rand() > 0.7 ? `Apt ${1 + Math.floor(rand() * 12)}` : "",
    city: pick(CITIES, rand),
    state: "NC",
    zip: String(27000 + Math.floor(rand() * 800)),
  };
}

function filledEda(org: TrainingProviderOrg, periodId: string): EdaSurveyDraft {
  const rand = rng(`eda-${org.id}-${periodId}`);
  const programs = programsFor(org);
  const month = getPeriodById(periodId).month ?? 9;
  return {
    ...emptyEdaDraft(),
    sectoralPartnership: partnershipFor(org.backbone),
    trainingProvider: org.name,
    trainingPrograms: [...programs],
    noParticipants: false,
    participants: programs.slice(0, 2).map((program, index) => participant(org, program, periodId, index, rand)),
    institutional: programs.map((program, index) => ({
      ...emptyInstitutional(org.name, program),
      programLength: pick(["3 - 6 months", "7 - 12 months", "Less than 3 months"], rand),
      environmentType: pick(["In-person", "Hybrid in-person and remote"], rand),
      programHours: index === 0 ? ["Full time program"] : ["Part time program"],
      softSkillTraining: "Yes",
      tuitionCost: money(rand, 2800, 6200),
      credentialType: "Occupational Certificates (Non-Academic Organizations)",
    })),
    admissions: programs.map((program) => {
      const enrolled = 6 + Math.floor(rand() * 10) + (month % 3);
      const admitted = enrolled + Math.floor(rand() * 3);
      const recruited = admitted + Math.floor(rand() * 4);
      return { ...emptyAdmissions(org.name, program), recruited: String(recruited), admitted: String(admitted), enrolled: String(enrolled) };
    }),
    completions: programs.map((program) => {
      const completed = 3 + Math.floor(rand() * 6);
      return {
        ...emptyCompletion(org.name, program),
        completed: String(completed),
        completedOnTime: String(Math.max(1, completed - 1)),
        completedNotContinuous: count(rand, 0, 1),
      };
    }),
    nonCompletions: programs.map((program, index) => ({
      ...emptyNonCompletion(org.name, program),
      didNotComplete: index === 0 ? count(rand, 1, 3) : "0",
      reasons: { ...emptyReasons(), startedJob: index === 0 ? count(rand, 1, 2) : "0", transportation: index === 0 ? count(rand, 0, 1) : "0" },
    })),
    employmentType: programs.map((program) => ({
      ...emptyEmploymentType(org.name, program),
      types: { ...emptyEmploymentTypes(), fullTime: count(rand, 2, 5), partTime: count(rand, 0, 2), earnAndLearn: count(rand, 0, 2) },
    })),
    earnAndLearn: programs.map((program) => ({
      ...emptyEarnAndLearn(org.name, program),
      workBasedLearning: "Yes",
      models: { ...emptyEarnAndLearnModels(), internship: count(rand, 1, 3), registeredApprenticeship: count(rand, 0, 1), customizedTraining: count(rand, 0, 1) },
    })),
    salaries: programs.map((program) => ({
      ...emptySalaries(org.name, program),
      medians: { ...emptySalaryMedians(), fullTime: wage(rand, 16, 24), partTime: wage(rand, 14, 18), earnAndLearn: wage(rand, 15, 20) },
      reportedPercent: count(rand, 48, 78),
    })),
    employmentStatus: programs.map((program) => ({
      ...emptyEmploymentStatus(org.name, program),
      statuses: {
        ...emptyEmploymentStatuses(),
        partnerInField: count(rand, 2, 5),
        nonPartnerInField: count(rand, 0, 2),
        stillSeeking: count(rand, 0, 2),
      },
      topOccupations: pick(["332710, 333517", "151211, 151212", "499021, 472111", "292061, 311131"], rand),
      topEmployers: `${org.region.replace(" region", "")} employers, partner firms`,
    })),
  };
}

function filledTechnical(org: TrainingProviderOrg, periodId: string, eda: EdaSurveyDraft): IntakeDraft {
  const rand = rng(`tech-${org.id}-${periodId}`);
  const month = MONTH_NAMES[(getPeriodById(periodId).month ?? 9) - 1];
  const challenge = pick(["Enrollment", "Staffing", "Retention", "Data Collection"], rand);
  const base = filledTechnicalDraft();
  const draft: IntakeDraft = {
    ...base,
    challengeKeywords: [...CHALLENGE_KEYWORDS],
    achievementKeywords: [...ACHIEVEMENT_KEYWORDS],
    challenges: [
      {
        keyword: challenge,
        detail: `${month} ${challenge.toLowerCase()} at ${org.name} required a short adjustment to keep ${org.program} on schedule.`,
      },
    ],
    plans: [
      {
        plan: `Assign a coordinator to close ${month.toLowerCase()} follow-up for ${org.program} within five days.`,
        potentialGain: "Fewer missing files and a shorter time from completion to placement confirmation.",
      },
    ],
    testimonial: {
      ...base.testimonial,
      files: base.testimonial.files.map((file) =>
        file
          ? {
              ...file,
              name: `S4G-${month}-${org.name.replace(/\s+/g, "-")}.pdf`,
            }
          : file,
      ),
    },
    mediaLink: {
      available: rand() > 0.25 ? "Yes" : "None",
      detail: rand() > 0.25 ? `Employer visit clip from the ${org.program} cohort in ${month}.` : "None",
    },
  };
  return { ...draft, ...applyTechnicalDefaults(draft, eda) };
}

function filledInvoice(org: TrainingProviderOrg, periodId: string) {
  const rand = rng(`inv-${org.id}-${periodId}`);
  const month = MONTH_NAMES[(getPeriodById(periodId).month ?? 9) - 1];
  return {
    invoiceNumber: `${org.code}-${periodId.replace("-", "")}`,
    amount: money(rand, 11200, 24800),
    notes: `${month} instructional and participant support costs for ${org.program}.`,
  };
}

function passedReview(): PackageReview {
  const sections = emptyEdaSections();
  for (const id of Object.keys(sections) as Array<keyof typeof sections>) {
    sections[id] = { score: "Passed", fieldMarks: {} };
  }
  return {
    "technical-report": { score: "Passed", fieldMarks: {} },
    invoice: { score: "Passed", fieldMarks: {} },
    "eda-survey": { score: "Passed", fieldMarks: {}, sections },
  };
}

function inReviewPartial(): PackageReview {
  const sections = emptyEdaSections();
  const order = Object.keys(sections) as Array<keyof typeof sections>;
  order.forEach((id, index) => {
    sections[id] = { score: index < 4 ? "Passed" : null, fieldMarks: {} };
  });
  return {
    "technical-report": { score: "Passed", fieldMarks: {} },
    invoice: { score: null, fieldMarks: {} },
    "eda-survey": { score: null, fieldMarks: {}, sections },
  };
}

function flaggedReview(): PackageReview {
  const sections = emptyEdaSections();
  const order = Object.keys(sections) as Array<keyof typeof sections>;
  order.forEach((id) => {
    sections[id] = { score: "Passed", fieldMarks: {} };
  });
  sections.admissions = {
    score: "Flagged",
    fieldMarks: { "eda.admissions.0": "bad" },
  };
  return {
    "technical-report": {
      score: "Flagged",
      fieldMarks: { "technical.challenges": "bad", "technical.plans": "good" },
    },
    invoice: { score: "Passed", fieldMarks: {} },
    "eda-survey": { score: "Flagged", fieldMarks: { "eda.admissions.0": "bad" }, sections },
  };
}

function withReview(record: Omit<PeriodSubmissionRecord, "review" | "reviewPublished" | "reviewFieldSnapshot"> & {
  review?: PackageReview;
  reviewPublished?: string | null;
  reviewFieldSnapshot?: Record<string, string>;
}): PeriodSubmissionRecord {
  const next: PeriodSubmissionRecord = {
    ...record,
    review: normalizePackageReview(record.review),
    reviewPublished: record.reviewPublished ?? null,
    reviewFieldSnapshot: record.reviewFieldSnapshot,
  };
  return next;
}

function emptyPeriodRecord(): PeriodSubmissionRecord {
  return withReview({
    status: "Action Needed",
    technical: defaultIntakeDraft(),
    eda: emptyEdaDraft(),
    invoice: emptyInvoiceDraft(),
    edaMaxStep: 0,
  });
}

function completeRecord(org: TrainingProviderOrg, periodId: string): PeriodSubmissionRecord {
  const eda = filledEda(org, periodId);
  const review = passedReview();
  return withReview({
    status: "Approved",
    technical: filledTechnical(org, periodId, eda),
    eda,
    invoice: filledInvoice(org, periodId),
    edaMaxStep: LAST_EDA_STEP,
    review,
    reviewPublished: reviewSignature(review),
  });
}

function septemberRecord(org: TrainingProviderOrg): PeriodSubmissionRecord {
  const status = SEPTEMBER_STATUSES[org.id] ?? "Not started";
  if (status === "Not started") return emptyPeriodRecord();

  const eda = filledEda(org, "2026-09");
  const technical = filledTechnical(org, "2026-09", eda);
  const invoice = filledInvoice(org, "2026-09");

  if (status === "Complete") {
    return completeRecord(org, "2026-09");
  }

  if (status === "Awaiting review") {
    return withReview({
      status: "Submitted",
      technical,
      eda,
      invoice,
      edaMaxStep: LAST_EDA_STEP,
      review: emptyPackageReview(),
    });
  }

  if (status === "In review") {
    return withReview({
      status: "Submitted",
      technical,
      eda,
      invoice,
      edaMaxStep: LAST_EDA_STEP,
      review: inReviewPartial(),
    });
  }

  const review = flaggedReview();
  const record = withReview({
    status: "Action Needed",
    technical,
    eda,
    invoice,
    edaMaxStep: LAST_EDA_STEP,
    review,
    reviewPublished: reviewSignature(review),
  });
  record.reviewFieldSnapshot = reviewValueSnapshot(record);
  return record;
}

function completedOffset(orgId: number, periodId: string): number {
  const rand = rng(`done-${orgId}-${periodId}`);
  return -Math.floor(rand() * 9);
}

function statusEntry(status: SubmissionStatus, periodId: string, orgId: number): ProviderPeriodStatus {
  const dueOn = getPeriodDueIso(getPeriodById(periodId));
  if (status === "Complete") {
    const completedOn = addDays(dueOn, completedOffset(orgId, periodId));
    return { status, statusChangedOn: completedOn, completedOn };
  }
  if (status === "Not started") {
    return { status, statusChangedOn: null, completedOn: null };
  }
  const notified = addDays(dueOn, status === "Missing/flagged" ? -2 : 1);
  return { status, statusChangedOn: notified, completedOn: null };
}

function statusMail(org: TrainingProviderOrg, status: SubmissionStatus): ReviewMail {
  const month = "September";
  const subject =
    status === "Missing/flagged"
      ? `Action needed: ${month} Steps4Growth report`
      : `${status}: ${month} Steps4Growth report`;
  return {
    id: `seed-${org.id}-2026-09`,
    periodId: "2026-09",
    providerId: org.id,
    recipients: [org.id === 1 ? "tp@tester.com" : `${org.name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@providers.s4g.test`],
    subject,
    body: [
      `Hello ${org.name},`,
      "",
      `Your ${month} submission status is marked ${status}.`,
      "",
      "Current due date: September 17, 2026",
      "Status: 4 days late",
    ].join("\n"),
    sentOn: "9/20/2026, 10:15:00 AM",
    status,
    kind: "status",
    source: "project-manager",
  };
}

export function createDemoSubmissionsState(): DemoSubmissionsState {
  const byProvider: DemoSubmissionsState["byProvider"] = {};
  const providerStatus: DemoSubmissionsState["providerStatus"] = {};
  const mail: ReviewMail[] = [];

  for (const periodId of ALL_MONTHS) {
    providerStatus[periodId] = {};
  }

  for (const org of TRAINING_PROVIDERS) {
    const periods: Record<string, PeriodSubmissionRecord> = {};
    for (const periodId of COMPLETE_MONTHS) {
      periods[periodId] = completeRecord(org, periodId);
      providerStatus[periodId][String(org.id)] = statusEntry("Complete", periodId, org.id);
    }
    periods["2026-09"] = septemberRecord(org);
    const septemberStatus = SEPTEMBER_STATUSES[org.id] ?? "Not started";
    providerStatus["2026-09"][String(org.id)] = statusEntry(septemberStatus, "2026-09", org.id);
    if (septemberStatus === "Missing/flagged") mail.push(statusMail(org, septemberStatus));
    byProvider[String(org.id)] = periods;
  }

  return {
    version: SUBMISSIONS_STORAGE_VERSION,
    byProvider,
    providerStatus,
    mail,
  };
}
