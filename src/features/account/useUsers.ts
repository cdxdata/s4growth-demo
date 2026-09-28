import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { showToast } from "@/store/uiSlice";
import { MAX_USERS, type User } from "@/types/auth";

export type UsersSummary = {
  isLoading: boolean;
  error: Error | null;
  organizationName: string;
  users: User[];
  atCapacity: boolean;
  name: string;
  email: string;
  formError: string;
  isSaving: boolean;
  setName: (value: string) => void;
  setEmail: (value: string) => void;
  add: (event: FormEvent) => void;
  remove: (id: string) => void;
};

export function useUsers(): UsersSummary {
  const identity = useAppSelector((state) => state.auth.identity);
  const entityId = identity?.entityId ?? "";
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");

  const query = useQuery({
    queryKey: queryKeys.entityDirectory(entityId),
    queryFn: () => reportingApi.getEntityDirectory(entityId),
    enabled: Boolean(entityId),
  });

  const add = useMutation({
    mutationFn: () => reportingApi.addUser(entityId, name, email),
    async onSuccess() {
      setName("");
      setEmail("");
      setFormError("");
      dispatch(showToast("User added."));
      await queryClient.invalidateQueries({ queryKey: queryKeys.entityDirectory(entityId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.directoryStats });
    },
    onError(err) {
      setFormError(err instanceof Error ? err.message : "Could not add that user.");
    },
  });

  const remove = useMutation({
    mutationFn: reportingApi.removeUser,
    async onSuccess() {
      dispatch(showToast("User removed."));
      await queryClient.invalidateQueries({ queryKey: queryKeys.entityDirectory(entityId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.directoryStats });
    },
  });

  const users = query.data?.users ?? [];

  return {
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : query.error ? new Error("Failed to load users") : null,
    organizationName: identity?.organizationName ?? "Organization",
    users,
    atCapacity: users.length >= MAX_USERS,
    name,
    email,
    formError,
    isSaving: add.isPending,
    setName,
    setEmail,
    add(event) {
      event.preventDefault();
      add.mutate();
    },
    remove: (id) => remove.mutate(id),
  };
}
