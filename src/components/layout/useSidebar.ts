import { useAppSelector } from "@/app/hooks";
import { NAV_BY_ROLE } from "@/constants/workspace";
import { ROLE_LABELS } from "@/constants/roles";

export type SidebarItem = {
  id: string;
  to: string;
  icon: string;
  label: string;
  end: boolean;
};

export type SidebarSummary = {
  items: SidebarItem[];
  teamName: string;
  teamSubtitle: string;
  canSignOut: boolean;
  canResetData: boolean;
  isItemActive: (pathname: string, id: string) => boolean;
};

export function useSidebar(): SidebarSummary {
  const identity = useAppSelector((state) => state.auth.identity);
  const fallbackName = useAppSelector((state) => state.workspace.teamName);
  const fallbackSubtitle = useAppSelector((state) => state.workspace.teamSubtitle);
  const role = identity?.role ?? "project-manager";
  const items = NAV_BY_ROLE[role];

  return {
    items: items.map((item) => ({
      ...item,
      end: item.to === "/",
    })),
    teamName: identity
      ? identity.kind === "representative"
        ? identity.name
        : identity.organizationName
      : fallbackName,
    teamSubtitle: identity
      ? identity.kind === "representative"
        ? `${ROLE_LABELS[identity.role]} representative`
        : ROLE_LABELS[identity.role]
      : fallbackSubtitle,
    canSignOut: Boolean(identity),
    canResetData: identity?.role === "admin",
    isItemActive(pathname, id) {
      if (id === "dashboard") return pathname === "/";
      if (id === "provider") return pathname.startsWith("/providers");
      if (id === "intake") return pathname.startsWith("/intake") || pathname.startsWith("/submissions");
      if (id === "participants") return pathname.startsWith("/participants");
      if (id === "review") return pathname.startsWith("/review");
      if (id === "nudges") return pathname.startsWith("/nudges");
      if (id === "ppr") return pathname.startsWith("/quarterly-draft");
      if (id === "representatives") return pathname.startsWith("/representatives");
      if (id === "project-manager") return pathname.includes("/project-manager");
      if (id === "training-provider") return pathname.includes("/training-provider");
      if (id === "backbone") return pathname.includes("/admin/roles/backbone") || pathname === "/admin/roles/backbone";
      if (id === "employment-liaison") return pathname.includes("/employment-liaison");
      return false;
    },
  };
}
