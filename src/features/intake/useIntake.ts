import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { reportingApi } from "@/api/client";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { markSubmitted, updateDraft } from "@/store/intakeSlice";
import { showToast } from "@/store/uiSlice";
import type { IntakeDraft } from "@/types/domain";

export type IntakeSummary = {
  form: IntakeDraft;
  error: string;
  isSubmitting: boolean;
  change: (event: ChangeEvent<HTMLTextAreaElement>) => void;
  saveDraft: () => void;
  submit: () => void;
};

export function useIntake(): IntakeSummary {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const form = useAppSelector((state) => state.intake.draft);
  const [error, setError] = useState("");

  const mutation = useMutation({
    mutationFn: reportingApi.submitIntake,
    async onSuccess() {
      dispatch(markSubmitted());
      dispatch(showToast("Monthly intake submitted for review."));
      await queryClient.invalidateQueries();
      navigate("/review");
    },
  });

  return {
    form,
    error,
    isSubmitting: mutation.isPending,
    change(event) {
      dispatch(updateDraft({ [event.target.name]: event.target.value }));
    },
    saveDraft() {
      navigate("/providers/1");
    },
    submit() {
      if (!form.challenges || !form.plan) {
        setError("Please complete the challenges and action-plan fields before submitting.");
        return;
      }
      setError("");
      mutation.mutate(form);
    },
  };
}
