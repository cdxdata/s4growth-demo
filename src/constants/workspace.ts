import type { AppRole } from "@/types/auth";

export type NavItem = {
  id: string;
  to: string;
  icon: string;
  label: string;
};

export const MANAGER_NAV: NavItem[] = [
  { id: "dashboard", to: "/", icon: "▦", label: "Dashboard" },
  { id: "provider", to: "/providers/1", icon: "◉", label: "Subawardee" },
  { id: "participants", to: "/participants", icon: "◎", label: "Participant review" },
  { id: "review", to: "/review", icon: "⚑", label: "Review queue" },
  { id: "nudges", to: "/nudges", icon: "✉", label: "Nudges" },
  { id: "ppr", to: "/quarterly-draft", icon: "▤", label: "Quarterly draft" },
  { id: "representatives", to: "/representatives", icon: "👤", label: "Representatives" },
];

export const ADMIN_NAV: NavItem[] = [
  { id: "dashboard", to: "/", icon: "▦", label: "Dashboard" },
  { id: "project-manager", to: "/admin/roles/project-manager", icon: "◆", label: "Project managers" },
  { id: "training-provider", to: "/admin/roles/training-provider", icon: "◉", label: "Training providers" },
  { id: "backbone", to: "/admin/roles/backbone", icon: "▣", label: "Backbones" },
  { id: "employment-liaison", to: "/admin/roles/employment-liaison", icon: "◎", label: "Employment liaisons" },
];

export const TRAINING_PROVIDER_NAV: NavItem[] = [
  { id: "dashboard", to: "/", icon: "▦", label: "Dashboard" },
  { id: "intake", to: "/submissions", icon: "▤", label: "Monthly Submissions" },
  { id: "representatives", to: "/representatives", icon: "👤", label: "Representatives" },
];

export const BACKBONE_NAV: NavItem[] = [
  { id: "dashboard", to: "/", icon: "▦", label: "Dashboard" },
  { id: "representatives", to: "/representatives", icon: "👤", label: "Representatives" },
];

export const LIAISON_NAV: NavItem[] = [
  { id: "dashboard", to: "/", icon: "▦", label: "Dashboard" },
  { id: "representatives", to: "/representatives", icon: "👤", label: "Representatives" },
];

export const NAV_BY_ROLE: Record<AppRole, NavItem[]> = {
  admin: ADMIN_NAV,
  "project-manager": MANAGER_NAV,
  "training-provider": TRAINING_PROVIDER_NAV,
  backbone: BACKBONE_NAV,
  "employment-liaison": LIAISON_NAV,
};

export const WORKSPACE_NAV = MANAGER_NAV;
