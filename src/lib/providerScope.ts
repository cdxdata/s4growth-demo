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

export function providerIdFromName(name: string | undefined): number | null {
  if (!name) return null;
  return TRAINING_PROVIDERS.find((item) => item.name === name)?.id ?? null;
}

export function resolveProviderId(identity: AuthIdentity | null | undefined, fallback = 1): number {
  if (identity?.role === "training-provider") {
    return providerIdFromName(identity.organizationName) ?? fallback;
  }
  return fallback;
}

export function providerNameById(id: number): string {
  return TRAINING_PROVIDERS.find((item) => item.id === id)?.name ?? "Training provider";
}
