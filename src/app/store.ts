import { configureStore, type Middleware } from "@reduxjs/toolkit";
import { persistAfterSubmissionsAction } from "@/lib/submissionsPersist";
import { authReducer } from "@/store/authSlice";
import { submissionsReducer } from "@/store/submissionsSlice";
import { uiReducer } from "@/store/uiSlice";
import { workspaceReducer } from "@/store/workspaceSlice";

const persistSubmissions: Middleware = (storeApi) => (next) => (action) => {
  const result = next(action);
  if (typeof action === "object" && action && "type" in action && typeof action.type === "string") {
    persistAfterSubmissionsAction(action.type, storeApi.getState().submissions);
  }
  return result;
};

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    submissions: submissionsReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(persistSubmissions),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
