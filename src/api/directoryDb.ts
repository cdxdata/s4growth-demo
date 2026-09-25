import { createDirectoryEntities, createDirectoryRepresentatives } from "@/constants/directorySeed";
import { TRAINING_PROVIDERS } from "@/constants/organizations";
import type {
  AppRole,
  AuthIdentity,
  DirectoryEntity,
  MagicLinkPreview,
  Representative,
  RoleDirectoryStats,
} from "@/types/auth";
import { MAX_REPRESENTATIVES } from "@/types/auth";
import type { SubmissionStatus } from "@/types/domain";

type MagicLinkRecord = MagicLinkPreview & {
  kind: AuthIdentity["kind"];
  identityId: string;
};

type DirectoryState = {
  entities: DirectoryEntity[];
  representatives: Representative[];
  magicLinks: MagicLinkRecord[];
  nextEntitySeq: number;
};

function clone<T>(value: T): T {
  return structuredClone(value);
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

const DIRECTORY_KEY = "s4g-directory";
const DIRECTORY_VERSION = 1;

function createInitialState(): DirectoryState {
  return {
    entities: createDirectoryEntities(),
    representatives: createDirectoryRepresentatives(),
    magicLinks: [],
    nextEntitySeq: 100,
  };
}

function persistDirectory(next: DirectoryState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DIRECTORY_KEY, JSON.stringify({ version: DIRECTORY_VERSION, ...next }));
}

function loadDirectory(): DirectoryState {
  const seeded = createInitialState();
  if (typeof window === "undefined") return seeded;
  try {
    const raw = window.localStorage.getItem(DIRECTORY_KEY);
    if (!raw) {
      persistDirectory(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw) as DirectoryState & { version?: number };
    if (parsed.version !== DIRECTORY_VERSION || !parsed.entities) {
      persistDirectory(seeded);
      return seeded;
    }
    return {
      entities: parsed.entities,
      representatives: parsed.representatives ?? [],
      magicLinks: parsed.magicLinks ?? [],
      nextEntitySeq: parsed.nextEntitySeq ?? 100,
    };
  } catch {
    return seeded;
  }
}

let state = loadDirectory();

function token(): string {
  return `s4g-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function entityById(id: string): DirectoryEntity | undefined {
  return state.entities.find((item) => item.id === id);
}

function toIdentityFromEntity(entity: DirectoryEntity): AuthIdentity {
  return {
    kind: "entity",
    id: entity.id,
    entityId: entity.id,
    role: entity.role,
    name: entity.name,
    email: entity.email,
    organizationName: entity.name,
  };
}

function toIdentityFromRep(rep: Representative, entity: DirectoryEntity): AuthIdentity {
  return {
    kind: "representative",
    id: rep.id,
    entityId: entity.id,
    role: entity.role,
    name: rep.name,
    email: rep.email,
    organizationName: entity.name,
  };
}

function findIdentityByEmail(email: string): AuthIdentity | null {
  const normalized = normalizeEmail(email);
  const entity = state.entities.find((item) => item.email === normalized);
  if (entity) return toIdentityFromEntity(entity);
  const rep = state.representatives.find((item) => item.email === normalized);
  if (!rep) return null;
  const parent = entityById(rep.entityId);
  return parent ? toIdentityFromRep(rep, parent) : null;
}

function emailTaken(email: string, exceptId?: string): boolean {
  const normalized = normalizeEmail(email);
  const entityHit = state.entities.some((item) => item.email === normalized && item.id !== exceptId);
  const repHit = state.representatives.some((item) => item.email === normalized && item.id !== exceptId);
  return entityHit || repHit;
}

function repsFor(entityId: string): Representative[] {
  return state.representatives.filter((item) => item.entityId === entityId);
}

export const directoryDb = {
  requestMagicLink(email: string): { preview: MagicLinkPreview } | { error: string } {
    const identity = findIdentityByEmail(email);
    if (!identity) {
      return { error: "That email is not approved to access this workspace." };
    }
    const record: MagicLinkRecord = {
      token: token(),
      email: identity.email,
      recipientName: identity.name,
      organizationName: identity.organizationName,
      kind: identity.kind,
      identityId: identity.id,
    };
    state.magicLinks = state.magicLinks.filter((item) => item.email !== identity.email);
    state.magicLinks.push(record);
    return {
      preview: {
        token: record.token,
        email: record.email,
        recipientName: record.recipientName,
        organizationName: record.organizationName,
      },
    };
  },

  verifyMagicLink(tokenValue: string): AuthIdentity | null {
    const record = state.magicLinks.find((item) => item.token === tokenValue);
    if (!record) return null;
    const identity =
      record.kind === "entity"
        ? (() => {
            const entity = entityById(record.identityId);
            return entity ? toIdentityFromEntity(entity) : null;
          })()
        : (() => {
            const rep = state.representatives.find((item) => item.id === record.identityId);
            const parent = rep ? entityById(rep.entityId) : undefined;
            return rep && parent ? toIdentityFromRep(rep, parent) : null;
          })();
    if (!identity) return null;
    return clone(identity);
  },

  getIdentity(id: string, kind: AuthIdentity["kind"]): AuthIdentity | null {
    if (kind === "entity") {
      const entity = entityById(id);
      return entity ? clone(toIdentityFromEntity(entity)) : null;
    }
    const rep = state.representatives.find((item) => item.id === id);
    const parent = rep ? entityById(rep.entityId) : undefined;
    return rep && parent ? clone(toIdentityFromRep(rep, parent)) : null;
  },

  getStats(): RoleDirectoryStats[] {
    return (["admin", "project-manager", "training-provider", "backbone", "employment-liaison"] as AppRole[]).map(
      (role) => {
        const entities = state.entities.filter((item) => item.role === role);
        const ids = new Set(entities.map((item) => item.id));
        return {
          role,
          entityCount: entities.length,
          representativeCount: state.representatives.filter((item) => ids.has(item.entityId)).length,
        };
      },
    );
  },

  listEntities(role: AppRole): Array<DirectoryEntity & { representatives: Representative[] }> {
    return clone(
      state.entities
        .filter((item) => item.role === role)
        .map((entity) => ({ ...entity, representatives: repsFor(entity.id) })),
    );
  },

  getEntity(id: string): (DirectoryEntity & { representatives: Representative[] }) | null {
    const entity = entityById(id);
    if (!entity) return null;
    return clone({ ...entity, representatives: repsFor(entity.id) });
  },

  addEntity(role: AppRole, name: string, email: string): DirectoryEntity | { error: string } {
    const trimmedName = name.trim();
    const normalized = normalizeEmail(email);
    if (!trimmedName || !normalized) return { error: "Name and email are required." };
    if (!normalized.includes("@")) return { error: "Enter a valid email address." };
    if (emailTaken(normalized)) return { error: "That email is already in use." };
    state.nextEntitySeq += 1;
    const entity: DirectoryEntity = {
      id: `${role}-${state.nextEntitySeq}`,
      role,
      name: trimmedName,
      email: normalized,
      orgId: role === "training-provider" || role === "backbone" || role === "employment-liaison" ? state.nextEntitySeq : undefined,
      employedCount: role === "employment-liaison" ? 0 : undefined,
      programs: role === "training-provider" ? ["New program"] : undefined,
    };
    state.entities.push(entity);
    persistDirectory(state);
    return clone(entity);
  },

  removeEntity(id: string): { error: string } | { ok: true } {
    const entity = entityById(id);
    if (!entity) return { error: "That organization was not found." };
    if (entity.role === "admin" && state.entities.filter((item) => item.role === "admin").length <= 1) {
      return { error: "The workspace must keep at least one admin." };
    }
    state.entities = state.entities.filter((item) => item.id !== id);
    state.representatives = state.representatives.filter((item) => item.entityId !== id);
    persistDirectory(state);
    return { ok: true };
  },

  addRepresentative(entityId: string, name: string, email: string): Representative | { error: string } {
    const entity = entityById(entityId);
    if (!entity) return { error: "That organization was not found." };
    if (entity.role === "admin") return { error: "Admin accounts cannot have representatives." };
    const current = repsFor(entityId);
    if (current.length >= MAX_REPRESENTATIVES) {
      return { error: `An organization can have up to ${MAX_REPRESENTATIVES} representatives.` };
    }
    const trimmedName = name.trim();
    const normalized = normalizeEmail(email);
    if (!trimmedName || !normalized) return { error: "Name and email are required." };
    if (!normalized.includes("@")) return { error: "Enter a valid email address." };
    if (emailTaken(normalized)) return { error: "That email is already in use." };
    const representative: Representative = {
      id: `${entityId}-r${Date.now().toString(36)}`,
      entityId,
      name: trimmedName,
      email: normalized,
    };
    state.representatives.push(representative);
    persistDirectory(state);
    return clone(representative);
  },

  removeRepresentative(id: string): { error: string } | { ok: true } {
    const exists = state.representatives.some((item) => item.id === id);
    if (!exists) return { error: "That representative was not found." };
    state.representatives = state.representatives.filter((item) => item.id !== id);
    persistDirectory(state);
    return { ok: true };
  },

  getTrainingProviderHome(entityId: string, submissionStatus: SubmissionStatus | null) {
    const entity = entityById(entityId);
    if (!entity || entity.role !== "training-provider") return null;
    const catalog = TRAINING_PROVIDERS.find((item) => item.id === entity.orgId);
    return clone({
      name: entity.name,
      email: entity.email,
      participantsInTraining: catalog?.enrolled ?? 0,
      programs: entity.programs ?? (catalog ? [catalog.program] : []),
      submissionStatus,
      region: catalog?.region ?? "—",
      program: catalog?.program ?? entity.programs?.[0] ?? "—",
    });
  },

  getBackboneHome(entityId: string, providers: Array<{ id: number; name: string; submissionStatus: SubmissionStatus }>) {
    const entity = entityById(entityId);
    if (!entity || entity.role !== "backbone") return null;
    const overseen = TRAINING_PROVIDERS.filter((item) => item.backbone === entity.name).slice(0, 4);
    return clone({
      name: entity.name,
      email: entity.email,
      trainingProviderCount: overseen.length,
      providers: overseen.map((org) => {
        const row = providers.find((item) => item.id === org.id);
        return {
          id: org.id,
          name: org.name,
          submissionStatus: row?.submissionStatus ?? ("Not started" as const),
        };
      }),
    });
  },

  getLiaisonHome(entityId: string) {
    const entity = entityById(entityId);
    if (!entity || entity.role !== "employment-liaison") return null;
    return clone({
      name: entity.name,
      email: entity.email,
      participantsEmployed: entity.employedCount ?? 0,
    });
  },

  getRepresentativesForProvider(providerId: number): Representative[] {
    const entity = state.entities.find((item) => item.role === "training-provider" && item.orgId === providerId);
    if (!entity) return [];
    return clone(repsFor(entity.id));
  },

  getProviderContact(providerId: number): { name: string; email: string } | null {
    const entity = state.entities.find((item) => item.role === "training-provider" && item.orgId === providerId);
    if (entity) return clone({ name: entity.name, email: entity.email });
    const org = TRAINING_PROVIDERS.find((item) => item.id === providerId);
    return org ? { name: org.name, email: `${org.name.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@providers.s4g.test` } : null;
  },

  resetToSeed() {
    state = createInitialState();
    persistDirectory(state);
    return clone(state);
  },

  getReviewRecipients(providerId: number): { providerName: string; recipients: string[] } {
    const entity = state.entities.find((item) => item.role === "training-provider" && item.orgId === providerId);
    const providerName = entity?.name ?? TRAINING_PROVIDERS.find((item) => item.id === providerId)?.name ?? "Training provider";
    const backboneName = TRAINING_PROVIDERS.find((item) => item.id === providerId)?.backbone;
    const backbone = backboneName
      ? state.entities.find((item) => item.role === "backbone" && item.name === backboneName)
      : undefined;
    const emails = new Set<string>();
    if (entity?.email) emails.add(entity.email);
    if (entity) {
      for (const rep of repsFor(entity.id)) emails.add(rep.email);
    }
    if (backbone?.email) emails.add(backbone.email);
    return { providerName, recipients: Array.from(emails) };
  },
};
