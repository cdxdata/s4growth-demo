import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { emptyEdaDraft, emptyInvoiceDraft, filledEdaDraft } from "@/constants/eda";
import { defaultIntakeDraft } from "@/lib/storage";
import type { IntakeDraft } from "@/types/domain";
import type { EdaSurveyDraft, InvoiceDraft, MonthlyPackageStatus, PeriodSubmissionRecord } from "@/types/submissions";

const STORAGE_KEY = "s4g-monthly-submissions";
const STORAGE_VERSION = 1;
const LAST_EDA_STEP = 9;

type SubmissionsState = {
  version: number;
  byPeriod: Record<string, PeriodSubmissionRecord>;
};

function emptyRecord(): PeriodSubmissionRecord {
  return {
    status: "Action Needed",
    technical: { achievements: "", challenges: "", plan: "", story: "" },
    eda: emptyEdaDraft(),
    invoice: emptyInvoiceDraft(),
    edaMaxStep: 0,
  };
}

function seedState(): SubmissionsState {
  const provider = "Piedmont Community College";
  return {
    version: STORAGE_VERSION,
    byPeriod: {
      "2026-07": {
        status: "Approved",
        technical: {
          achievements: "July cohorts completed CNC fundamentals with employer site visits in Alamance and Guilford.",
          challenges: "Two evening sections ran below capacity after a plant schedule change.",
          plan: "Move one section to a weekend format and add employer-referred seats.",
          story: "A participant moved from temporary work into a full-time machining role.",
        },
        eda: { ...filledEdaDraft(provider), asOfDate: "2026-07-31", enrolled: "16", newEnrollments: "6" },
        invoice: { invoiceNumber: "PCC-2026-07", amount: "18420", notes: "July instructional and wraparound costs." },
        edaMaxStep: LAST_EDA_STEP,
      },
      "2026-08": {
        status: "Submitted",
        technical: {
          achievements: "August added a second manufacturing pathway and a paid internship block.",
          challenges: "Credential paperwork lagged for late completers.",
          plan: "Assign a staff reviewer to close credential files within five days.",
          story: "",
        },
        eda: filledEdaDraft(provider),
        invoice: { invoiceNumber: "PCC-2026-08", amount: "", notes: "" },
        edaMaxStep: LAST_EDA_STEP,
      },
      "2026-09": {
        status: "Action Needed",
        technical: defaultIntakeDraft,
        eda: emptyEdaDraft(),
        invoice: emptyInvoiceDraft(),
        edaMaxStep: 0,
      },
    },
  };
}

function persist(state: SubmissionsState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState(): SubmissionsState {
  const seeded = seedState();
  if (typeof window === "undefined") return seeded;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seeded;
    const parsed = JSON.parse(raw) as SubmissionsState;
    if (parsed.version !== STORAGE_VERSION || !parsed.byPeriod) return seeded;
    return {
      version: STORAGE_VERSION,
      byPeriod: { ...seeded.byPeriod, ...parsed.byPeriod },
    };
  } catch {
    return seeded;
  }
}

const initialState: SubmissionsState = typeof window === "undefined" ? seedState() : loadState();

function ensurePeriod(state: SubmissionsState, periodId: string): PeriodSubmissionRecord {
  if (!state.byPeriod[periodId]) {
    state.byPeriod[periodId] = emptyRecord();
  }
  return state.byPeriod[periodId];
}

const submissionsSlice = createSlice({
  name: "submissions",
  initialState,
  reducers: {
    updateTechnical(state, action: PayloadAction<{ periodId: string; patch: Partial<IntakeDraft> }>) {
      const record = ensurePeriod(state, action.payload.periodId);
      record.technical = { ...record.technical, ...action.payload.patch };
      persist(state);
    },
    updateEda(state, action: PayloadAction<{ periodId: string; patch: Partial<EdaSurveyDraft> }>) {
      const record = ensurePeriod(state, action.payload.periodId);
      record.eda = { ...record.eda, ...action.payload.patch };
      persist(state);
    },
    updateInvoice(state, action: PayloadAction<{ periodId: string; patch: Partial<InvoiceDraft> }>) {
      const record = ensurePeriod(state, action.payload.periodId);
      record.invoice = { ...record.invoice, ...action.payload.patch };
      persist(state);
    },
    setEdaMaxStep(state, action: PayloadAction<{ periodId: string; step: number }>) {
      const record = ensurePeriod(state, action.payload.periodId);
      record.edaMaxStep = Math.max(record.edaMaxStep, action.payload.step);
      persist(state);
    },
    submitMonthlyPackage(state, action: PayloadAction<{ periodId: string }>) {
      const record = ensurePeriod(state, action.payload.periodId);
      if (record.status !== "Approved") {
        record.status = "Submitted";
      }
      persist(state);
    },
    markPackageStatus(state, action: PayloadAction<{ periodId: string; status: MonthlyPackageStatus }>) {
      const record = ensurePeriod(state, action.payload.periodId);
      record.status = action.payload.status;
      persist(state);
    },
  },
});

export const {
  updateTechnical,
  updateEda,
  updateInvoice,
  setEdaMaxStep,
  submitMonthlyPackage,
  markPackageStatus,
} = submissionsSlice.actions;
export const submissionsReducer = submissionsSlice.reducer;

export function getPeriodSubmission(state: SubmissionsState, periodId: string): PeriodSubmissionRecord {
  return state.byPeriod[periodId] ?? emptyRecord();
}
