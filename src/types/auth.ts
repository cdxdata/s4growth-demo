export const APP_ROLES = [
  "admin",
  "project-manager",
  "training-provider",
  "backbone",
  "employment-liaison",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type DirectoryEntity = {
  id: string;
  role: AppRole;
  name: string;
  email: string;
  orgId?: number;
  employedCount?: number;
  programs?: string[];
};

export type User = {
  id: string;
  entityId: string;
  name: string;
  email: string;
};

export type AuthIdentity = {
  kind: "entity" | "user";
  id: string;
  entityId: string;
  role: AppRole;
  name: string;
  email: string;
  organizationName: string;
};

export type MagicLinkPreview = {
  token: string;
  email: string;
  recipientName: string;
  organizationName: string;
};

export type RoleDirectoryStats = {
  role: AppRole;
  entityCount: number;
  userCount: number;
};

export const MAX_USERS = 4;
