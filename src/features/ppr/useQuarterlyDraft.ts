import { useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { demoEdaSubmissionAdapter, type EdaExportConfirmation } from "@/adapters/edaSubmission";
import { getContainingQuarter, getPeriodById } from "@/constants/periods";
import { assembleQuarter } from "@/lib/quarterAssembler";
import { buildQuarterReport, type QuarterReport } from "@/lib/quarterReport";
import { resolveProviderId } from "@/lib/providerScope";
import type { QuarterlyDraft } from "@/types/domain";

export type QuarterlyDraftSummary = {
  isLoading: boolean;
  error: Error | null;
  quarter: string;
  draft: QuarterlyDraft | null;
  report: QuarterReport;
  print: () => void;
  isGenerating: boolean;
  confirmation: EdaExportConfirmation | null;
  generate: () => Promise<void>;
};

export function useQuarterlyDraft(): QuarterlyDraftSummary {
  const periodId = useAppSelector((state) => state.workspace.selectedPeriodId);
  const identity = useAppSelector((state) => state.auth.identity);
  const providerId = resolveProviderId(identity);
  const byProvider = useAppSelector((state) => state.submissions.byProvider);
  const records = byProvider[String(providerId)] ?? {};
  const quarter = getContainingQuarter(getPeriodById(periodId));
  const draft = assembleQuarter(quarter, records);
  const report = buildQuarterReport(quarter, byProvider, identity?.organizationName ?? "NC A&T Project Office");
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmation, setConfirmation] = useState<EdaExportConfirmation | null>(null);

  return {
    isLoading: false,
    error: null,
    quarter: report.quarterLabel,
    draft,
    report,
    isGenerating,
    confirmation,
    async generate() {
      setIsGenerating(true);
      try {
        setConfirmation(
          await demoEdaSubmissionAdapter.generate({
            quarterLabel: report.quarterLabel,
            providerName: identity?.organizationName ?? "Piedmont Community College",
            records,
            draft,
          }),
        );
      } finally {
        setIsGenerating(false);
      }
    },
    print() {
      window.print();
    },
  };
}
