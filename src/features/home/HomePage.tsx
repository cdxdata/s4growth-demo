import { useAppSelector } from "@/app/hooks";
import { AdminDashboardPage } from "@/features/admin/AdminDashboardPage";
import { BackboneHomePage } from "@/features/backbone/BackboneHomePage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { LiaisonHomePage } from "@/features/liaison/LiaisonHomePage";
import { TrainingProviderHomePage } from "@/features/tp/TrainingProviderHomePage";

export function HomePage() {
  const role = useAppSelector((state) => state.auth.identity?.role);

  if (role === "admin") return <AdminDashboardPage />;
  if (role === "training-provider") return <TrainingProviderHomePage />;
  if (role === "backbone") return <BackboneHomePage />;
  if (role === "employment-liaison") return <LiaisonHomePage />;
  return <DashboardPage />;
}
