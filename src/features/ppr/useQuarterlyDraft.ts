import { useState } from "react";
import { useAppSelector } from "@/app/hooks";
import { demoEdaSubmissionAdapter, type EdaExportConfirmation } from "@/adapters/edaSubmission";
import { getContainingQuarter, getPeriodById } from "@/constants/periods";
import { assembleQuarter } from "@/lib/quarterAssembler";
import { resolveProviderId } from "@/lib/providerScope";
import type { QuarterlyDraft } from "@/types/domain";

export type QuarterlyDraftSummary = {
  isLoading: boolean;
  error: Error | null;
  quarter: string;
  draft: QuarterlyDraft | null;
  print: () => void;
  isGenerating: boolean;
  confirmation: EdaExportConfirmation | null;
  generate: () => Promise<void>;
};

export function useQuarterlyDraft(): QuarterlyDraftSummary {
  const periodId = useAppSelector((state) => state.workspace.selectedPeriodId);
  const identity = useAppSelector((state) => state.auth.identity);
  const providerId = resolveProviderId(identity);
  const records = useAppSelector((state) => state.submissions.byProvider[String(providerId)] ?? {});
  const quarter = getContainingQuarter(getPeriodById(periodId));
  const draft = assembleQuarter(quarter, records);
  const [isGenerating, setIsGenerating] = useState(false);
  const [confirmation, setConfirmation] = useState<EdaExportConfirmation | null>(null);

  return {
    isLoading: false,
    error: null,
    quarter: `Q${quarter.quarter} ${quarter.year}`,
    draft,
    isGenerating,
    confirmation,
    async generate() {
      setIsGenerating(true);
      try {
        setConfirmation(await demoEdaSubmissionAdapter.generate({
          quarterLabel: `Q${quarter.quarter} ${quarter.year}`,
          providerName: identity?.organizationName ?? "Piedmont Community College",
          records,
          draft,
        }));
      } finally {
        setIsGenerating(false);
      }
    },
    print() {
      window.print();
    },
  };
}
