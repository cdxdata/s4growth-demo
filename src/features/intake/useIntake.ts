import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type ChangeEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { reportingApi } from "@/api/client";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { DEFAULT_PERIOD_ID, getPeriodById } from "@/constants/periods";
import { getPeriodSubmission, updateTechnical } from "@/store/submissionsSlice";
import { markSubmitted, updateDraft } from "@/store/intakeSlice";
import { showToast } from "@/store/uiSlice";
import type { IntakeDraft } from "@/types/domain";

export type IntakeSummary = {
  form: IntakeDraft;
  error: string;
  isSubmitting: boolean;
  isTrainingProvider: boolean;
  monthLabel: string;
  organizationName: string;
  change: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  saveDraft: () => void;
  submit: () => void;
  goBack: () => void;
};

function resolvePeriodId(paramId: string | undefined, selectedId: string): string {
  if (paramId) return paramId;
  const selected = getPeriodById(selectedId);
  if (selected.kind === "monthly") return selected.id;
  return DEFAULT_PERIOD_ID;
}

export function useIntake(): IntakeSummary {
  const { periodId: periodParam } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const selectedPeriodId = useAppSelector((state) => state.workspace.selectedPeriodId);
  const periodId = resolvePeriodId(periodParam, selectedPeriodId);
  const period = getPeriodById(periodId);
  const role = useAppSelector((state) => state.auth.identity?.role);
  const organizationName = useAppSelector((state) =>
    state.auth.identity?.role === "training-provider"
      ? (state.auth.identity.organizationName ?? "Piedmont Community College")
      : "Piedmont Community College",
  );
  const stored = useAppSelector((state) => getPeriodSubmission(state.submissions, periodId).technical);
  const intakeDraft = useAppSelector((state) => state.intake.draft);
  const isTrainingProvider = role === "training-provider";
  const form = isTrainingProvider || periodParam ? stored : intakeDraft;
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: reportingApi.submitIntake,
    async onSuccess() {
      dispatch(markSubmitted());
      dispatch(showToast("Monthly Submissions report submitted for review."));
      await queryClient.invalidateQueries();
      navigate(isTrainingProvider ? "/submissions" : "/review");
    },
  });

  return {
    form,
    error,
    isSubmitting: mutation.isPending,
    isTrainingProvider,
    monthLabel: period.windowLabel,
    organizationName,
    change(event) {
      const patch = { [event.target.name]: event.target.value };
      dispatch(updateTechnical({ periodId, patch }));
      if (!isTrainingProvider) dispatch(updateDraft(patch));
    },
    saveDraft() {
      dispatch(showToast("Technical report saved."));
      navigate(isTrainingProvider ? "/submissions" : "/providers/1");
    },
    submit() {
      if (!form.achievements || !form.challenges || !form.plan) {
        setError("Please complete the required narrative fields before submitting.");
        return;
      }
      setError("");
      if (isTrainingProvider) {
        dispatch(showToast("Technical report saved."));
        navigate("/submissions");
        return;
      }
      mutation.mutate(form);
    },
    goBack() {
      navigate(isTrainingProvider ? "/submissions" : "/providers/1");
    },
  };
}
