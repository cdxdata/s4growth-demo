import { directoryDb } from "@/api/directoryDb";
import { mockDb } from "@/api/mockDb";
import type { AppRole } from "@/types/auth";
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

  async requestMagicLink(email: string) {
    await wait(NETWORK_DELAY_MS);
    return directoryDb.requestMagicLink(email);
  },

  async verifyMagicLink(token: string) {
    await wait(NETWORK_DELAY_MS);
    const identity = directoryDb.verifyMagicLink(token);
    if (!identity) throw new Error("This sign-in link is invalid or has already been used.");
    return identity;
  },

  async getDirectoryStats() {
    await wait(NETWORK_DELAY_MS);
    return directoryDb.getStats();
  },

  async listRoleDirectory(role: AppRole) {
    await wait(NETWORK_DELAY_MS);
    return directoryDb.listEntities(role);
  },

  async addEntity(role: AppRole, name: string, email: string) {
    await wait(NETWORK_DELAY_MS);
    const result = directoryDb.addEntity(role, name, email);
    if ("error" in result) throw new Error(result.error);
    return result;
  },

  async removeEntity(id: string) {
    await wait(NETWORK_DELAY_MS);
    const result = directoryDb.removeEntity(id);
    if ("error" in result) throw new Error(result.error);
    return result;
  },

  async addRepresentative(entityId: string, name: string, email: string) {
    await wait(NETWORK_DELAY_MS);
    const result = directoryDb.addRepresentative(entityId, name, email);
    if ("error" in result) throw new Error(result.error);
    return result;
  },

  async removeRepresentative(id: string) {
    await wait(NETWORK_DELAY_MS);
    const result = directoryDb.removeRepresentative(id);
    if ("error" in result) throw new Error(result.error);
    return result;
  },

  async getEntityDirectory(id: string) {
    await wait(NETWORK_DELAY_MS);
    const entity = directoryDb.getEntity(id);
    if (!entity) throw new Error("That organization was not found.");
    return entity;
  },

  async getTrainingProviderHome(entityId: string, periodId: string) {
    await wait(NETWORK_DELAY_MS);
    const dashboard = mockDb.getDashboard(periodId);
    const entity = directoryDb.getEntity(entityId);
    const match = dashboard.providers.find((item) => item.id === entity?.orgId);
    const home = directoryDb.getTrainingProviderHome(entityId, match?.submissionStatus ?? null);
    if (!home) throw new Error("Training provider workspace was not found.");
    return home;
  },

  async getBackboneHome(entityId: string, periodId: string) {
    await wait(NETWORK_DELAY_MS);
    const dashboard = mockDb.getDashboard(periodId);
    const home = directoryDb.getBackboneHome(
      entityId,
      dashboard.providers.map((item) => ({
        id: item.id,
        name: item.name,
        submissionStatus: item.submissionStatus,
      })),
    );
    if (!home) throw new Error("Backbone workspace was not found.");
    return home;
  },

  async getLiaisonHome(entityId: string) {
    await wait(NETWORK_DELAY_MS);
    const home = directoryDb.getLiaisonHome(entityId);
    if (!home) throw new Error("Employment liaison workspace was not found.");
    return home;
  },
};
