import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { emptyEdaDraft, emptyInvoiceDraft } from "@/constants/eda";
import { createDemoSubmissionsState, SUBMISSIONS_STORAGE_KEY, SUBMISSIONS_STORAGE_VERSION } from "@/lib/demoSeed";
import { persistSubmissionsNow } from "@/lib/submissionsPersist";
import { isProviderId } from "@/lib/providerScope";
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
  persistSubmissionsNow(state);
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

type Scoped = { providerId: number; periodId: string };

function ensureScoped(state: SubmissionsState, action: Scoped): PeriodSubmissionRecord | null {
  if (!isProviderId(action.providerId) || !action.periodId) return null;
  return ensureRecord(state, action.providerId, action.periodId);
}

const submissionsSlice = createSlice({
  name: "submissions",
  initialState,
  reducers: {
    updateTechnical(state, action: PayloadAction<Scoped & { patch: Partial<IntakeDraft> }>) {
      const record = ensureScoped(state, action.payload);
      if (!record) return;
      record.technical = { ...record.technical, ...action.payload.patch };
      reconcileChangedMarks(record);
    },
    updateEda(state, action: PayloadAction<Scoped & { patch: Partial<EdaSurveyDraft> }>) {
      const record = ensureScoped(state, action.payload);
      if (!record) return;
      record.eda = { ...record.eda, ...action.payload.patch };
      reconcileChangedMarks(record);
    },
    saveEdaDraft(state, action: PayloadAction<Scoped>) {
      ensureScoped(state, action.payload);
    },
    updateInvoice(state, action: PayloadAction<Scoped & { patch: Partial<InvoiceDraft> }>) {
      const record = ensureScoped(state, action.payload);
      if (!record) return;
      record.invoice = { ...record.invoice, ...action.payload.patch };
      reconcileChangedMarks(record);
    },
    setEdaMaxStep(state, action: PayloadAction<Scoped & { step: number }>) {
      const record = ensureScoped(state, action.payload);
      if (!record) return;
      record.edaMaxStep = Math.max(record.edaMaxStep, action.payload.step);
    },
    submitMonthlyPackage(state, action: PayloadAction<Scoped>) {
      const record = ensureScoped(state, action.payload);
      if (!record) return;
      if (record.status !== "Approved") record.status = "Submitted";
    },
    markPackageStatus(state, action: PayloadAction<Scoped & { status: MonthlyPackageStatus }>) {
      const record = ensureScoped(state, action.payload);
      if (!record) return;
      record.status = action.payload.status;
    },
    setFormScore(state, action: PayloadAction<Scoped & { formId: ReviewFormId; score: FormScore | null }>) {
      const record = ensureScoped(state, action.payload);
      if (!record) return;
      if (action.payload.formId === "eda-survey") return;
      record.review[action.payload.formId].score = action.payload.score;
      if (action.payload.score !== "Flagged") record.review[action.payload.formId].fieldMarks = {};
    },
    setEdaSectionScore(state, action: PayloadAction<Scoped & { sectionId: string; score: FormScore | null }>) {
      const record = ensureScoped(state, action.payload);
      if (!record) return;
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
    },
    setFieldMark(state, action: PayloadAction<Scoped & { formId: ReviewFormId; fieldId: string; mark: FieldMark | null }>) {
      const record = ensureScoped(state, action.payload);
      if (!record) return;
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
    },
    restoreReview(state, action: PayloadAction<Scoped & { review: PackageReview }>) {
      const record = ensureScoped(state, action.payload);
      if (!record) return;
      record.review = normalizePackageReview(action.payload.review);
    },
    setReviewPublished(state, action: PayloadAction<Scoped & { signature: string | null }>) {
      const record = ensureScoped(state, action.payload);
      if (!record) return;
      record.reviewPublished = action.payload.signature;
    },
    captureReviewSnapshot(state, action: PayloadAction<Scoped>) {
      const record = ensureScoped(state, action.payload);
      if (!record) return;
      record.reviewFieldSnapshot = reviewValueSnapshot(record);
    },
    reconcileReviewChanges(state, action: PayloadAction<Scoped>) {
      const record = ensureScoped(state, action.payload);
      if (!record) return;
      reconcileChangedMarks(record);
    },
    setProviderPeriodStatus(
      state,
      action: PayloadAction<{ providerId: number; periodId: string; status: SubmissionStatus }>,
    ) {
      const { providerId, periodId, status } = action.payload;
      if (!isProviderId(providerId) || !periodId) return;
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
    },
    recordMail(state, action: PayloadAction<ReviewMail>) {
      state.mail = [action.payload, ...state.mail].slice(0, 40);
    },
    resetDemoData() {
      return seedState();
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
  providerId: number | null | undefined,
): PeriodSubmissionRecord {
  if (!isProviderId(providerId)) return emptyRecord();
  return state.byProvider[String(providerId)]?.[periodId] ?? emptyRecord();
}

export function getProviderPeriodStatus(
  state: SubmissionsState,
  periodId: string,
  providerId: number | null | undefined,
): ProviderPeriodStatus | null {
  if (!isProviderId(providerId)) return null;
  return state.providerStatus[periodId]?.[String(providerId)] ?? null;
}
