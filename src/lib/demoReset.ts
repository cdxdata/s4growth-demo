import { directoryDb } from "@/api/directoryDb";
import { createDemoSubmissionsState } from "@/lib/demoSeed";
import { STORAGE_KEYS } from "@/lib/storage";
import { cancelSubmissionsPersist, persistSubmissionsNow } from "@/lib/submissionsPersist";

export const RESET_CLEARS_KEYS = [STORAGE_KEYS.notificationLog, STORAGE_KEYS.workbookImported] as const;
export const RESET_PRESERVES_KEYS = [STORAGE_KEYS.session] as const;

export function resetDemoWorkspaceData() {
  cancelSubmissionsPersist();
  directoryDb.resetToSeed();
  persistSubmissionsNow(createDemoSubmissionsState());
  if (typeof window === "undefined") return;
  for (const key of RESET_CLEARS_KEYS) window.localStorage.removeItem(key);
}

export function resetDemoWorkspace() {
  resetDemoWorkspaceData();
  window.location.reload();
}
