import { configureStore } from "@reduxjs/toolkit";
import { intakeReducer } from "@/store/intakeSlice";
import { uiReducer } from "@/store/uiSlice";
import { workspaceReducer } from "@/store/workspaceSlice";

export const store = configureStore({
  reducer: {
    workspace: workspaceReducer,
    intake: intakeReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
