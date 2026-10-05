import { TRAINING_PROVIDERS } from "@/constants/organizations";
import type { AuthIdentity } from "@/types/auth";
import type { ProviderType } from "@/types/domain";

const TYPE_SHORT: Record<ProviderType, string> = {
  "Training provider": "TP",
  Backbone: "BB",
  "Employment liaison": "EL",
};

export function providerCategoryShort(type: ProviderType): string {
  return TYPE_SHORT[type];
}

export function isProviderId(id: number | null | undefined): id is number {
  return typeof id === "number" && Number.isInteger(id) && id > 0;
}

export function parseProviderRouteId(value: string | undefined): number | null {
  if (!value) return null;
  const id = Number(value);
  return isProviderId(id) ? id : null;
}

export function providerIdFromName(name: string | undefined): number | null {
  if (!name) return null;
  return TRAINING_PROVIDERS.find((item) => item.name === name)?.id ?? null;
}

export function resolveProviderId(identity: AuthIdentity | null | undefined): number | null {
  if (identity?.role !== "training-provider") return null;
  const fromEntity = /^tp-(\d+)$/.exec(identity.entityId);
  if (fromEntity) {
    const id = Number(fromEntity[1]);
    if (isProviderId(id)) return id;
  }
  return providerIdFromName(identity.organizationName);
}

export function providerNameById(id: number | null | undefined): string {
  if (!isProviderId(id)) return "Training provider";
  return TRAINING_PROVIDERS.find((item) => item.id === id)?.name ?? "Training provider";
}
