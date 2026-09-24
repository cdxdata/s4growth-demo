import type { AuthIdentity } from "@/types/auth";
import type { NudgeLog } from "@/types/domain";

export const STORAGE_KEYS = {
  workbookImported: "s4g-workbook-imported",
  notificationLog: "s4g-notification-log",
  session: "s4g-session",
} as const;

export function readWorkbookImported(): boolean {
  return localStorage.getItem(STORAGE_KEYS.workbookImported) === "true";
}

export function writeWorkbookImported(): void {
  localStorage.setItem(STORAGE_KEYS.workbookImported, "true");
}

export function readNotificationLog(): NudgeLog | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.notificationLog);
    return raw ? (JSON.parse(raw) as NudgeLog) : null;
  } catch {
    return null;
  }
}

export function writeNotificationLog(record: NudgeLog): void {
  localStorage.setItem(STORAGE_KEYS.notificationLog, JSON.stringify(record));
}

export function readSession(): AuthIdentity | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.session);
    return raw ? (JSON.parse(raw) as AuthIdentity) : null;
  } catch {
    return null;
  }
}

export function writeSession(identity: AuthIdentity): void {
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(identity));
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.session);
}

export { defaultIntakeDraft } from "@/lib/technicalReport";
