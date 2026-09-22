import { useMutation } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { reportingApi } from "@/api/client";
import { useAppDispatch } from "@/app/hooks";
import { setIdentity } from "@/store/authSlice";
import type { MagicLinkPreview } from "@/types/auth";

export type LoginSummary = {
  email: string;
  error: string;
  isSending: boolean;
  isVerifying: boolean;
  preview: MagicLinkPreview | null;
  setEmail: (value: string) => void;
  submit: (event: FormEvent) => void;
  openLink: () => void;
};

export function useLogin(): LoginSummary {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<MagicLinkPreview | null>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const token = searchParams.get("token");

  const verify = useMutation({
    mutationFn: reportingApi.verifyMagicLink,
    onSuccess(identity) {
      dispatch(setIdentity(identity));
      navigate("/", { replace: true });
    },
    onError(err) {
      setError(err instanceof Error ? err.message : "Sign-in failed.");
    },
  });

  const request = useMutation({
    mutationFn: reportingApi.requestMagicLink,
    onSuccess(result) {
      if ("error" in result) {
        setPreview(null);
        setError(result.error);
        return;
      }
      setError("");
      setPreview(result.preview);
    },
    onError() {
      setError("Unable to send a sign-in email right now.");
    },
  });

  useEffect(() => {
    if (token) verify.mutate(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return {
    email,
    error,
    isSending: request.isPending,
    isVerifying: Boolean(token) || verify.isPending,
    preview,
    setEmail,
    submit(event) {
      event.preventDefault();
      setError("");
      request.mutate(email);
    },
    openLink() {
      if (!preview) return;
      verify.mutate(preview.token);
    },
  };
}
