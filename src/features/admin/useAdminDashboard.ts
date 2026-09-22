import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { ROLE_PLURALS, ROLE_TIER_ONE, ROLE_TIER_TWO } from "@/constants/roles";
import type { AppRole, RoleDirectoryStats } from "@/types/auth";

export type AdminRoleCard = {
  role: AppRole;
  title: string;
  entityCount: number;
  representativeCount: number;
};

export type AdminDashboardSummary = {
  isLoading: boolean;
  error: Error | null;
  tierOne: AdminRoleCard[];
  tierTwo: AdminRoleCard[];
  openRole: (role: AppRole) => void;
};

function toCard(stats: RoleDirectoryStats[]): (role: AppRole) => AdminRoleCard {
  return (role) => {
    const match = stats.find((item) => item.role === role);
    return {
      role,
      title: ROLE_PLURALS[role],
      entityCount: match?.entityCount ?? 0,
      representativeCount: match?.representativeCount ?? 0,
    };
  };
}

export function useAdminDashboard(): AdminDashboardSummary {
  const navigate = useNavigate();
  const query = useQuery({
    queryKey: queryKeys.directoryStats,
    queryFn: reportingApi.getDirectoryStats,
  });
  const stats = query.data ?? [];
  const card = toCard(stats);

  return {
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : query.error ? new Error("Failed to load directory") : null,
    tierOne: ROLE_TIER_ONE.map(card),
    tierTwo: ROLE_TIER_TWO.map(card),
    openRole: (role) => navigate(`/admin/roles/${role}`),
  };
}
