import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { emptyEdaDraft, emptyInvoiceDraft } from "@/constants/eda";
import { createDemoSubmissionsState, SUBMISSIONS_STORAGE_KEY, SUBMISSIONS_STORAGE_VERSION } from "@/lib/demoSeed";
import { defaultIntakeDraft } from "@/lib/storage";
import { DEMO_TODAY } from "@/lib/reportingDates";
import {
  changedReviewFieldIds,
  deriveEdaScore,
  edaSectionFromFieldId,
  emptyPackageReview,
  fieldsForForm,
  mergeEdaFieldMarks,
  normalizeEdaReview,
  normalizePackageReview,
  passIfAllFieldsGood,
  reviewValueSnapshot,
  unmarkChangedFields,
} from "@/lib/reviewModel";
import type { IntakeDraft, SubmissionStatus } from "@/types/domain";
import type {
  EdaSurveyDraft,
  FieldMark,
  FormScore,
  InvoiceDraft,
  MonthlyPackageStatus,
  PackageReview,
  PeriodSubmissionRecord,
  ProviderPeriodStatus,
  ReviewFormId,
  ReviewMail,
} from "@/types/submissions";

const STORAGE_KEY = SUBMISSIONS_STORAGE_KEY;
const STORAGE_VERSION = SUBMISSIONS_STORAGE_VERSION;

export type SubmissionsState = {
  version: number;
  byProvider: Record<string, Record<string, PeriodSubmissionRecord>>;
  providerStatus: Record<string, Record<string, ProviderPeriodStatus>>;
  mail: ReviewMail[];
};

function emptyRecord(): PeriodSubmissionRecord {
  return {
    status: "Action Needed",
    technical: defaultIntakeDraft(),
    eda: emptyEdaDraft(),
    invoice: emptyInvoiceDraft(),
    edaMaxStep: 0,
    review: emptyPackageReview(),
    reviewPublished: null,
    reviewFieldSnapshot: undefined,
  };
}

function withReview(
  record: Omit<PeriodSubmissionRecord, "review"> & {
    review?: PackageReview;
    reviewPublished?: string | null;
    reviewFieldSnapshot?: Record<string, string>;
  },
): PeriodSubmissionRecord {
  return {
    ...record,
    review: normalizePackageReview(record.review),
    reviewPublished: record.reviewPublished ?? null,
    reviewFieldSnapshot: record.reviewFieldSnapshot,
  };
}

function reconcileChangedMarks(record: PeriodSubmissionRecord) {
  if (!record.reviewFieldSnapshot) return;
  const next = unmarkChangedFields(record.review, changedReviewFieldIds(record));
  if (next === record.review) return;
  record.review = next;
}

function seedState(): SubmissionsState {
  return createDemoSubmissionsState();
}

function persist(state: SubmissionsState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function migrate(raw: unknown): SubmissionsState | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as {
    version?: number;
    byPeriod?: Record<string, PeriodSubmissionRecord>;
    byProvider?: Record<string, Record<string, PeriodSubmissionRecord>>;
    providerStatus?: Record<string, Record<string, ProviderPeriodStatus>>;
    mail?: ReviewMail[];
  };
  if (parsed.version === 8 && parsed.byPeriod) {
    const byPeriod: Record<string, PeriodSubmissionRecord> = {};
    for (const [periodId, record] of Object.entries(parsed.byPeriod)) {
      byPeriod[periodId] = withReview(record);
    }
    return { version: STORAGE_VERSION, byProvider: { "1": byPeriod }, providerStatus: {}, mail: [] };
  }
  if (parsed.version === STORAGE_VERSION && parsed.byProvider) {
    const byProvider: Record<string, Record<string, PeriodSubmissionRecord>> = {};
    for (const [providerId, periods] of Object.entries(parsed.byProvider)) {
      byProvider[providerId] = {};
      for (const [periodId, record] of Object.entries(periods)) {
        byProvider[providerId][periodId] = withReview(record);
      }
    }
    return {
      version: STORAGE_VERSION,
      byProvider,
      providerStatus: parsed.providerStatus ?? {},
      mail: parsed.mail ?? [],
    };
  }
  return null;
}

function loadState(): SubmissionsState {
  const seeded = seedState();
  if (typeof window === "undefined") return seeded;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      persist(seeded);
      return seeded;
    }
    const migrated = migrate(JSON.parse(raw));
    if (!migrated) {
      persist(seeded);
      return seeded;
    }
    return {
      ...migrated,
      byProvider: { ...seeded.byProvider, ...migrated.byProvider },
      providerStatus: { ...seeded.providerStatus, ...migrated.providerStatus },
    };
  } catch {
    return seeded;
  }
}

const initialState: SubmissionsState = typeof window === "undefined" ? seedState() : loadState();

function ensureRecord(state: SubmissionsState, providerId: number, periodId: string): PeriodSubmissionRecord {
  const key = String(providerId);
  if (!state.byProvider[key]) state.byProvider[key] = {};
  if (!state.byProvider[key][periodId]) state.byProvider[key][periodId] = emptyRecord();
  state.byProvider[key][periodId].review = normalizePackageReview(state.byProvider[key][periodId].review);
  if (state.byProvider[key][periodId].reviewPublished === undefined) state.byProvider[key][periodId].reviewPublished = null;
  return state.byProvider[key][periodId];
}

type Scoped = { providerId?: number; periodId: string };

function scopeId(action: Scoped): number {
  return action.providerId ?? 1;
}

const submissionsSlice = createSlice({
  name: "submissions",
  initialState,
  reducers: {
    updateTechnical(state, action: PayloadAction<Scoped & { patch: Partial<IntakeDraft> }>) {
      const record = ensureRecord(state, scopeId(action.payload), action.payload.periodId);
      record.technical = { ...record.technical, ...action.payload.patch };
      reconcileChangedMarks(record);
      persist(state);
    },
    updateEda(state, action: PayloadAction<Scoped & { patch: Partial<EdaSurveyDraft> }>) {
      const record = ensureRecord(state, scopeId(action.payload), action.payload.periodId);
      record.eda = { ...record.eda, ...action.payload.patch };
      reconcileChangedMarks(record);
      persist(state);
    },
    saveEdaDraft(state, action: PayloadAction<Scoped>) {
      ensureRecord(state, scopeId(action.payload), action.payload.periodId);
      persist(state);
    },
    updateInvoice(state, action: PayloadAction<Scoped & { patch: Partial<InvoiceDraft> }>) {
      const record = ensureRecord(state, scopeId(action.payload), action.payload.periodId);
      record.invoice = { ...record.invoice, ...action.payload.patch };
      reconcileChangedMarks(record);
      persist(state);
    },
    setEdaMaxStep(state, action: PayloadAction<Scoped & { step: number }>) {
      const record = ensureRecord(state, scopeId(action.payload), action.payload.periodId);
      record.edaMaxStep = Math.max(record.edaMaxStep, action.payload.step);
      persist(state);
    },
    submitMonthlyPackage(state, action: PayloadAction<Scoped>) {
      const record = ensureRecord(state, scopeId(action.payload), action.payload.periodId);
      if (record.status !== "Approved") record.status = "Submitted";
      persist(state);
    },
    markPackageStatus(state, action: PayloadAction<Scoped & { status: MonthlyPackageStatus }>) {
      const record = ensureRecord(state, scopeId(action.payload), action.payload.periodId);
      record.status = action.payload.status;
      persist(state);
    },
    setFormScore(state, action: PayloadAction<Scoped & { formId: ReviewFormId; score: FormScore | null }>) {
      const record = ensureRecord(state, scopeId(action.payload), action.payload.periodId);
      if (action.payload.formId === "eda-survey") return;
      record.review[action.payload.formId].score = action.payload.score;
      if (action.payload.score !== "Flagged") record.review[action.payload.formId].fieldMarks = {};
      persist(state);
    },
    setEdaSectionScore(state, action: PayloadAction<Scoped & { sectionId: string; score: FormScore | null }>) {
      const record = ensureRecord(state, scopeId(action.payload), action.payload.periodId);
      const eda = normalizeEdaReview(record.review["eda-survey"]);
      const section = eda.sections[action.payload.sectionId];
      if (!section) return;
      section.score = action.payload.score;
      if (action.payload.score !== "Flagged") section.fieldMarks = {};
      record.review["eda-survey"] = {
        score: deriveEdaScore(eda.sections),
        fieldMarks: mergeEdaFieldMarks(eda.sections),
        sections: eda.sections,
      };
      persist(state);
    },
    setFieldMark(state, action: PayloadAction<Scoped & { formId: ReviewFormId; fieldId: string; mark: FieldMark | null }>) {
      const record = ensureRecord(state, scopeId(action.payload), action.payload.periodId);
      if (action.payload.formId === "eda-survey") {
        const eda = normalizeEdaReview(record.review["eda-survey"]);
        const sectionId = edaSectionFromFieldId(action.payload.fieldId);
        if (!sectionId || !eda.sections[sectionId]) return;
        if (action.payload.mark) {
          eda.sections[sectionId].fieldMarks[action.payload.fieldId] = action.payload.mark;
        } else {
          delete eda.sections[sectionId].fieldMarks[action.payload.fieldId];
        }
        const passed = passIfAllFieldsGood(
          eda.sections[sectionId].score,
          fieldsForForm("eda-survey", record).filter((field) => field.sectionId === sectionId),
          eda.sections[sectionId].fieldMarks,
        );
        eda.sections[sectionId].score = passed.score;
        eda.sections[sectionId].fieldMarks = passed.fieldMarks;
        record.review["eda-survey"] = {
          score: deriveEdaScore(eda.sections),
          fieldMarks: mergeEdaFieldMarks(eda.sections),
          sections: eda.sections,
        };
        persist(state);
        return;
      }
      if (action.payload.mark) {
        record.review[action.payload.formId].fieldMarks[action.payload.fieldId] = action.payload.mark;
      } else {
        delete record.review[action.payload.formId].fieldMarks[action.payload.fieldId];
      }
      const passed = passIfAllFieldsGood(
        record.review[action.payload.formId].score,
        fieldsForForm(action.payload.formId, record),
        record.review[action.payload.formId].fieldMarks,
      );
      record.review[action.payload.formId].score = passed.score;
      record.review[action.payload.formId].fieldMarks = passed.fieldMarks;
      persist(state);
    },
    restoreReview(state, action: PayloadAction<Scoped & { review: PackageReview }>) {
      const record = ensureRecord(state, scopeId(action.payload), action.payload.periodId);
      record.review = normalizePackageReview(action.payload.review);
      persist(state);
    },
    setReviewPublished(state, action: PayloadAction<Scoped & { signature: string | null }>) {
      const record = ensureRecord(state, scopeId(action.payload), action.payload.periodId);
      record.reviewPublished = action.payload.signature;
      persist(state);
    },
    captureReviewSnapshot(state, action: PayloadAction<Scoped>) {
      const record = ensureRecord(state, scopeId(action.payload), action.payload.periodId);
      record.reviewFieldSnapshot = reviewValueSnapshot(record);
      persist(state);
    },
    reconcileReviewChanges(state, action: PayloadAction<Scoped>) {
      const record = ensureRecord(state, scopeId(action.payload), action.payload.periodId);
      const before = record.review;
      reconcileChangedMarks(record);
      if (record.review !== before) persist(state);
    },
    setProviderPeriodStatus(
      state,
      action: PayloadAction<{ providerId: number; periodId: string; status: SubmissionStatus }>,
    ) {
      const { providerId, periodId, status } = action.payload;
      if (!state.providerStatus[periodId]) state.providerStatus[periodId] = {};
      state.providerStatus[periodId][String(providerId)] = {
        status,
        statusChangedOn: DEMO_TODAY,
        completedOn: status === "Complete" ? DEMO_TODAY : null,
      };
      const record = ensureRecord(state, providerId, periodId);
      if (status === "Complete") record.status = "Approved";
      if (status === "Missing/flagged") record.status = "Action Needed";
      if (status === "In review" || status === "Awaiting review") record.status = "Submitted";
      persist(state);
    },
    recordMail(state, action: PayloadAction<ReviewMail>) {
      state.mail = [action.payload, ...state.mail].slice(0, 40);
      persist(state);
    },
    resetDemoData() {
      const next = seedState();
      persist(next);
      return next;
    },
  },
});

export const {
  updateTechnical,
  updateEda,
  saveEdaDraft,
  updateInvoice,
  setEdaMaxStep,
  submitMonthlyPackage,
  markPackageStatus,
  setFormScore,
  setEdaSectionScore,
  setFieldMark,
  restoreReview,
  setReviewPublished,
  captureReviewSnapshot,
  reconcileReviewChanges,
  setProviderPeriodStatus,
  recordMail,
  resetDemoData,
} = submissionsSlice.actions;
export const submissionsReducer = submissionsSlice.reducer;

export function getPeriodSubmission(
  state: SubmissionsState,
  periodId: string,
  providerId = 1,
): PeriodSubmissionRecord {
  return state.byProvider[String(providerId)]?.[periodId] ?? emptyRecord();
}

export function getProviderPeriodStatus(
  state: SubmissionsState,
  periodId: string,
  providerId: number,
): ProviderPeriodStatus | null {
  return state.providerStatus[periodId]?.[String(providerId)] ?? null;
}
