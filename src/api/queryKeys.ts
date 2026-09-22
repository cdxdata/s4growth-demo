export const queryKeys = {
  dashboard: (periodId: string) => ["dashboard", periodId] as const,
  provider: (id: number) => ["provider", id] as const,
  participants: ["participants"] as const,
  review: ["review"] as const,
  nudges: ["nudges"] as const,
  quarterlyDraft: ["quarterly-draft"] as const,
};

