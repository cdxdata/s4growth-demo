import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { DEFAULT_PERIOD_ID } from "@/constants/periods";

type WorkspaceState = {
  selectedPeriodId: string;
  teamName: string;
  teamSubtitle: string;
};

const initialState: WorkspaceState = {
  selectedPeriodId: DEFAULT_PERIOD_ID,
  teamName: "NC A&T Team",
  teamSubtitle: "Demo workspace",
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    selectPeriod(state, action: PayloadAction<string>) {
      state.selectedPeriodId = action.payload;
    },
  },
});

export const { selectPeriod } = workspaceSlice.actions;
export const workspaceReducer = workspaceSlice.reducer;
