import { Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { IntakePage } from "@/features/intake/IntakePage";
import { NudgesPage } from "@/features/nudges/NudgesPage";
import { ParticipantsPage } from "@/features/participants/ParticipantsPage";
import { QuarterlyDraftPage } from "@/features/ppr/QuarterlyDraftPage";
import { ProviderPage } from "@/features/providers/ProviderPage";
import { ReviewPage } from "@/features/review/ReviewPage";

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/providers/:id" element={<ProviderPage />} />
        <Route path="/intake" element={<IntakePage />} />
        <Route path="/participants" element={<ParticipantsPage />} />
        <Route path="/review" element={<ReviewPage />} />
        <Route path="/nudges" element={<NudgesPage />} />
        <Route path="/quarterly-draft" element={<QuarterlyDraftPage />} />
      </Route>
    </Routes>
  );
}
