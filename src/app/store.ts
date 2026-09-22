import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "@/store/authSlice";
import { intakeReducer } from "@/store/intakeSlice";
import { submissionsReducer } from "@/store/submissionsSlice";
import { uiReducer } from "@/store/uiSlice";
import { workspaceReducer } from "@/store/workspaceSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    intake: intakeReducer,
    submissions: submissionsReducer,
    ui: uiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
