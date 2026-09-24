import type { AppRole } from "@/types/auth";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  "project-manager": "Project Manager",
  "training-provider": "Training Provider",
  backbone: "Backbone",
  "employment-liaison": "Employment Liaison",
};

export const ROLE_PLURALS: Record<AppRole, string> = {
  admin: "Admins",
  "project-manager": "Project Managers",
  "training-provider": "Training Providers",
  backbone: "Backbones",
  "employment-liaison": "Employment Liaisons",
};

export const ROLE_TIER_ONE: AppRole[] = ["admin", "project-manager"];
export const ROLE_TIER_TWO: AppRole[] = ["training-provider", "backbone", "employment-liaison"];
