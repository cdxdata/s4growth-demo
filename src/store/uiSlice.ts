import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type UiState = {
  toast: string | null;
};

const initialState: UiState = {
  toast: null,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    showToast(state, action: PayloadAction<string>) {
      state.toast = action.payload;
    },
    clearToast(state) {
      state.toast = null;
    },
  },
});

export const { showToast, clearToast } = uiSlice.actions;
export const uiReducer = uiSlice.reducer;
