import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { defaultIntakeDraft } from "@/lib/storage";
import type { IntakeDraft } from "@/types/domain";

type IntakeState = {
  draft: IntakeDraft;
  submitted: boolean;
};

const initialState: IntakeState = {
  draft: defaultIntakeDraft(),
  submitted: false,
};

const intakeSlice = createSlice({
  name: "intake",
  initialState,
  reducers: {
    updateDraft(state, action: PayloadAction<Partial<IntakeDraft>>) {
      state.draft = { ...state.draft, ...action.payload };
    },
    markSubmitted(state) {
      state.submitted = true;
    },
  },
});

export const { updateDraft, markSubmitted } = intakeSlice.actions;
export const intakeReducer = intakeSlice.reducer;
