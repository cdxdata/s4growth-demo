import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { useAppDispatch } from "@/app/hooks";
import { showToast } from "@/store/uiSlice";
import type { ReviewFlag } from "@/types/domain";

export type ReviewSummary = {
  isLoading: boolean;
  error: Error | null;
  stats: Array<{ label: string; value: string | number; note: string; tone?: "warn" | "bad" | "" }>;
  flags: ReviewFlag[];
  handleFlag: (flag: ReviewFlag) => void;
};

export function useReview(): ReviewSummary {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: queryKeys.review,
    queryFn: reportingApi.getReview,
  });
  const confirm = useMutation({
    mutationFn: reportingApi.confirmCompletionTotal,
    async onSuccess() {
      dispatch(showToast("Completion variance marked as reviewer-confirmed."));
      await queryClient.invalidateQueries();
    },
  });

  const data = query.data;

  return {
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : query.error ? new Error("Failed to load review queue") : null,
    stats: [
      { label: "Open flags", value: data?.stats.openFlags ?? "—", note: "Across 3 providers", tone: "bad" },
      { label: "Missing information", value: data?.stats.missingInformation ?? "—", note: "Required fields or dates", tone: "warn" },
      { label: "Reported variances", value: data?.stats.reportedVariances ?? "—", note: "Requires confirmation", tone: "warn" },
      { label: "Resolved this month", value: data?.stats.resolvedThisMonth ?? "—", note: "Reviewer-confirmed" },
    ],
    flags: data?.flags ?? [],
    handleFlag(flag) {
      if (flag.action === "confirm-total") {
        confirm.mutate();
        return;
      }
      if (flag.action === "view-record") {
        navigate("/participants");
        return;
      }
      if (flag.action === "preview-nudge") {
        navigate("/nudges");
      }
    },
  };
}
