export const queryKeys = {
  dashboard: (periodId: string) => ["dashboard", periodId] as const,
  provider: (id: number) => ["provider", id] as const,
  participants: ["participants"] as const,
  review: ["review"] as const,
  nudges: ["nudges"] as const,
  quarterlyDraft: ["quarterly-draft"] as const,
  directoryStats: ["directory-stats"] as const,
  roleDirectory: (role: string) => ["role-directory", role] as const,
  entityDirectory: (id: string) => ["entity-directory", id] as const,
  tpHome: (entityId: string, periodId: string) => ["tp-home", entityId, periodId] as const,
  backboneHome: (entityId: string, periodId: string) => ["backbone-home", entityId, periodId] as const,
  liaisonHome: (entityId: string) => ["liaison-home", entityId] as const,
};

