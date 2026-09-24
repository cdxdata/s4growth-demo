import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { useAppSelector } from "@/app/hooks";
import { RepresentativesPage } from "@/features/account/RepresentativesPage";
import { RoleDirectoryPage } from "@/features/admin/RoleDirectoryPage";
import { LoginPage } from "@/features/auth/LoginPage";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { HomePage } from "@/features/home/HomePage";
import { IntakePage } from "@/features/intake/IntakePage";
import { EdaReviewPage } from "@/features/submissions/EdaReviewPage";
import { EdaSurveyPage } from "@/features/submissions/EdaSurveyPage";
import { InvoicePage } from "@/features/submissions/InvoicePage";
import { MonthlySubmissionsPage } from "@/features/submissions/MonthlySubmissionsPage";
import { NudgesPage } from "@/features/nudges/NudgesPage";
import { ParticipantsPage } from "@/features/participants/ParticipantsPage";
import { QuarterlyDraftPage } from "@/features/ppr/QuarterlyDraftPage";
import { ProviderPage } from "@/features/providers/ProviderPage";
import { ReviewPage } from "@/features/review/ReviewPage";

function LoginGate() {
  const identity = useAppSelector((state) => state.auth.identity);
  if (identity) return <Navigate to="/" replace />;
  return <LoginPage />;
}

function ManagerIntakePage() {
  const role = useAppSelector((state) => state.auth.identity?.role);
  if (role === "training-provider") return <Navigate to="/submissions" replace />;
  return <IntakePage />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginGate />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin/roles/:role" element={<RoleDirectoryPage />} />
          <Route path="/providers/:id" element={<ProviderPage />} />
          <Route path="/intake" element={<ManagerIntakePage />} />
          <Route path="/submissions" element={<MonthlySubmissionsPage />} />
          <Route path="/submissions/:periodId/technical-report" element={<IntakePage />} />
          <Route path="/submissions/:periodId/eda" element={<EdaSurveyPage />} />
          <Route path="/submissions/:periodId/eda/review" element={<EdaReviewPage />} />
          <Route path="/submissions/:periodId/eda/:segmentId" element={<EdaSurveyPage />} />
          <Route path="/submissions/:periodId/invoice" element={<InvoicePage />} />
          <Route path="/participants" element={<ParticipantsPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/nudges" element={<NudgesPage />} />
          <Route path="/quarterly-draft" element={<QuarterlyDraftPage />} />
          <Route path="/representatives" element={<RepresentativesPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
