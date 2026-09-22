import { type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { getPeriodById } from "@/constants/periods";
import { getPeriodSubmission, updateInvoice } from "@/store/submissionsSlice";
import { showToast } from "@/store/uiSlice";
import type { InvoiceDraft } from "@/types/submissions";

export type InvoiceSummary = {
  monthLabel: string;
  organizationName: string;
  form: InvoiceDraft;
  change: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  goBack: () => void;
  save: () => void;
};

export function useInvoice(): InvoiceSummary {
  const { periodId = "" } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const identity = useAppSelector((state) => state.auth.identity);
  const form = useAppSelector((state) => getPeriodSubmission(state.submissions, periodId).invoice);

  return {
    monthLabel: getPeriodById(periodId).windowLabel,
    organizationName: identity?.organizationName ?? "Training provider",
    form,
    change(event) {
      dispatch(updateInvoice({ periodId, patch: { [event.target.name]: event.target.value } }));
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
