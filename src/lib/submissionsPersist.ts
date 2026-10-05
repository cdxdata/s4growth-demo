import { SUBMISSIONS_STORAGE_KEY } from "@/lib/demoSeed";

export const SUBMISSIONS_PERSIST_DEBOUNCE_MS = 400;

const DEBOUNCED_ACTIONS = new Set([
  "submissions/updateEda",
  "submissions/updateTechnical",
  "submissions/updateInvoice",
  "submissions/saveEdaDraft",
  "submissions/setEdaMaxStep",
  "submissions/setFormScore",
  "submissions/setEdaSectionScore",
  "submissions/setFieldMark",
  "submissions/reconcileReviewChanges",
]);

type PersistStorage = Pick<Storage, "setItem">;

let storageOverride: PersistStorage | null | undefined;
let timer: ReturnType<typeof setTimeout> | null = null;
let latest: unknown = null;
let lifecycleBound = false;

export function setSubmissionsPersistStorage(storage: PersistStorage | null | undefined) {
  storageOverride = storage;
}

function activeStorage(): PersistStorage | null {
  if (storageOverride !== undefined) return storageOverride;
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

export function cancelSubmissionsPersist() {
  if (timer) clearTimeout(timer);
  timer = null;
  latest = null;
}

export function persistSubmissionsNow(state: unknown) {
  cancelSubmissionsPersist();
  const storage = activeStorage();
  if (!storage) return;
  try {
    storage.setItem(SUBMISSIONS_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Quota or private-mode failures must not crash a keystroke reducer.
  }
}

export function scheduleSubmissionsPersist(state: unknown) {
  latest = state;
  if (typeof window === "undefined" && storageOverride === undefined) return;
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    if (latest === null) return;
    const pending = latest;
    latest = null;
    persistSubmissionsNow(pending);
  }, SUBMISSIONS_PERSIST_DEBOUNCE_MS);
}

export function flushSubmissionsPersist() {
  if (latest === null) {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    return;
  }
  persistSubmissionsNow(latest);
}

export function persistAfterSubmissionsAction(type: string, state: unknown) {
  if (!type.startsWith("submissions/")) return;
  if (DEBOUNCED_ACTIONS.has(type)) {
    scheduleSubmissionsPersist(state);
    return;
  }
  persistSubmissionsNow(state);
}

export function bindSubmissionsPersistLifecycle() {
  if (lifecycleBound || typeof window === "undefined") return;
  lifecycleBound = true;
  window.addEventListener("beforeunload", flushSubmissionsPersist);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushSubmissionsPersist();
  });
}
