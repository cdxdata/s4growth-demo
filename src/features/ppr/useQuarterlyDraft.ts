import { useQuery } from "@tanstack/react-query";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { useAppSelector } from "@/app/hooks";
import { getContainingQuarter, getPeriodById } from "@/constants/periods";
import type { QuarterlyDraft } from "@/types/domain";

export type QuarterlyDraftSummary = {
  isLoading: boolean;
  error: Error | null;
  quarter: string;
  draft: QuarterlyDraft | null;
  print: () => void;
};

export function useQuarterlyDraft(): QuarterlyDraftSummary {
  const periodId = useAppSelector((state) => state.workspace.selectedPeriodId);
  const quarter = getContainingQuarter(getPeriodById(periodId));
  const query = useQuery({
    queryKey: queryKeys.quarterlyDraft,
    queryFn: reportingApi.getQuarterlyDraft,
  });

  return {
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : query.error ? new Error("Failed to load quarterly draft") : null,
    quarter: `Q${quarter.quarter} ${quarter.year}`,
    draft: query.data ?? null,
    print() {
      window.print();
    },
  };
}
