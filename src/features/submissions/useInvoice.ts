import { type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { getPeriodById } from "@/constants/periods";
import { resolveProviderId } from "@/lib/providerScope";
import { getPeriodSubmission, updateInvoice } from "@/store/submissionsSlice";
import { showToast } from "@/store/uiSlice";
import type { InvoiceDraft } from "@/types/submissions";

export type InvoiceSummary = {
  monthLabel: string;
  organizationName: string;
  form: InvoiceDraft;
  showMarks: boolean;
  fieldMarks: Record<string, "good" | "bad">;
  change: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  goBack: () => void;
  save: () => void;
};

export function useInvoice(): InvoiceSummary {
  const { periodId = "" } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const identity = useAppSelector((state) => state.auth.identity);
  const providerId = resolveProviderId(identity);
  const record = useAppSelector((state) => getPeriodSubmission(state.submissions, periodId, providerId));
  const form = record.invoice;

  return {
    monthLabel: getPeriodById(periodId).windowLabel,
    organizationName: identity?.organizationName ?? "Training provider",
    form,
    showMarks: record.review.invoice.score === "Flagged",
    fieldMarks: record.review.invoice.fieldMarks,
    change(event) {
      dispatch(updateInvoice({ providerId, periodId, patch: { [event.target.name]: event.target.value } }));
    },
    goBack() {
      navigate("/submissions");
    },
    save() {
      dispatch(showToast("Invoice saved."));
      navigate("/submissions");
    },
  };
}
