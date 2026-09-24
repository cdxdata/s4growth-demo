import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAppSelector } from "@/app/hooks";
import type { AppRole } from "@/types/auth";

const ROUTE_ROLES: Array<{ test: (path: string) => boolean; roles: AppRole[] }> = [
  { test: (path) => path.startsWith("/admin"), roles: ["admin"] },
  { test: (path) => path.startsWith("/providers"), roles: ["project-manager"] },
  { test: (path) => path.startsWith("/participants"), roles: ["project-manager"] },
  { test: (path) => path.startsWith("/review"), roles: ["project-manager"] },
  { test: (path) => path.startsWith("/nudges"), roles: ["project-manager"] },
  { test: (path) => path.startsWith("/quarterly-draft"), roles: ["project-manager"] },
  { test: (path) => path.startsWith("/intake"), roles: ["project-manager", "training-provider"] },
  { test: (path) => path.startsWith("/submissions"), roles: ["training-provider"] },
  { test: (path) => path.startsWith("/representatives"), roles: ["project-manager", "training-provider", "backbone", "employment-liaison"] },
];

export function RequireAuth() {
  const identity = useAppSelector((state) => state.auth.identity);
  const location = useLocation();

  if (!identity) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const rule = ROUTE_ROLES.find((item) => item.test(location.pathname));
  if (rule && !rule.roles.includes(identity.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
