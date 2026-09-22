import { mockDb } from "@/api/mockDb";
import type { IntakeDraft } from "@/types/domain";

const NETWORK_DELAY_MS = 220;
const IMPORT_DELAY_MS = 900;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export const reportingApi = {
  async getDashboard(periodId: string) {
    await wait(NETWORK_DELAY_MS);
    return mockDb.getDashboard(periodId);
  },

  async getProvider(id: number) {
    await wait(NETWORK_DELAY_MS);
    const detail = mockDb.getProvider(id);
    if (!detail) {
      throw new Error(`Subawardee ${id} was not found.`);
    }
    return detail;
  },

  async getParticipants() {
    await wait(NETWORK_DELAY_MS);
    return mockDb.getParticipants();
  },

  async importWorkbook() {
    await wait(IMPORT_DELAY_MS);
    return mockDb.importWorkbook();
  },

  async getReview() {
    await wait(NETWORK_DELAY_MS);
    return mockDb.getReview();
  },

  async confirmCompletionTotal() {
    await wait(NETWORK_DELAY_MS);
    return mockDb.confirmCompletionTotal();
  },

  async submitIntake(draft: IntakeDraft) {
    await wait(NETWORK_DELAY_MS);
    return mockDb.submitIntake(draft);
  },

  async getNudges() {
    await wait(NETWORK_DELAY_MS);
    return mockDb.getNudges();
  },

  async sendNudge() {
    await wait(NETWORK_DELAY_MS);
    return mockDb.sendNudge();
  },

  async getQuarterlyDraft() {
    await wait(NETWORK_DELAY_MS);
    return mockDb.getQuarterlyDraft();
  },
};
