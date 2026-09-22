import { useAppSelector } from "@/app/hooks";
import { WORKSPACE_NAV, type NavId } from "@/constants/workspace";

export type SidebarItem = {
  id: NavId;
  to: string;
  icon: string;
  label: string;
  end: boolean;
};

export type SidebarSummary = {
  items: SidebarItem[];
  teamName: string;
  teamSubtitle: string;
  isItemActive: (pathname: string, id: NavId) => boolean;
};

export function useSidebar(): SidebarSummary {
  const teamName = useAppSelector((state) => state.workspace.teamName);
  const teamSubtitle = useAppSelector((state) => state.workspace.teamSubtitle);

  return {
    items: WORKSPACE_NAV.map((item) => ({
      ...item,
      end: item.to === "/",
    })),
    teamName,
    teamSubtitle,
    isItemActive(pathname, id) {
      const match: Record<NavId, boolean> = {
        dashboard: pathname === "/",
        provider: pathname.startsWith("/providers"),
        intake: pathname.startsWith("/intake"),
        participants: pathname.startsWith("/participants"),
        review: pathname.startsWith("/review"),
        nudges: pathname.startsWith("/nudges"),
        ppr: pathname.startsWith("/quarterly-draft"),
      };
      return match[id];
    },
  };
}
