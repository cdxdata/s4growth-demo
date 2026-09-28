import { directoryDb } from "@/api/directoryDb";
import { createDemoSubmissionsState, SUBMISSIONS_STORAGE_KEY } from "@/lib/demoSeed";
import { STORAGE_KEYS } from "@/lib/storage";

export function resetDemoWorkspace() {
  directoryDb.resetToSeed();
  window.localStorage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(createDemoSubmissionsState()));
  window.localStorage.removeItem(STORAGE_KEYS.notificationLog);
  window.localStorage.removeItem(STORAGE_KEYS.workbookImported);
  window.location.reload();
}
