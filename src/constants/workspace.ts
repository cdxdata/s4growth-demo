export const WORKSPACE_NAV = [
  { id: "dashboard", to: "/", icon: "▦", label: "Dashboard" },
  { id: "provider", to: "/providers/1", icon: "◉", label: "Subawardees" },
  { id: "intake", to: "/intake", icon: "▤", label: "Monthly intake" },
  { id: "participants", to: "/participants", icon: "◎", label: "Participant review" },
  { id: "review", to: "/review", icon: "⚑", label: "Review queue" },
  { id: "nudges", to: "/nudges", icon: "✉", label: "Nudges" },
  { id: "ppr", to: "/quarterly-draft", icon: "▤", label: "Quarterly draft" },
] as const;

export type NavId = (typeof WORKSPACE_NAV)[number]["id"];
