import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { showToast } from "@/store/uiSlice";
import { MAX_ORG_CONTACTS, type OrgContact } from "@/types/auth";

export type OrgContactsSummary = {
  isLoading: boolean;
  error: Error | null;
  organizationName: string;
  orgContacts: OrgContact[];
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

export function useOrgContacts(): OrgContactsSummary {
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
    mutationFn: () => reportingApi.addOrgContact(entityId, name, email),
    async onSuccess() {
      setName("");
      setEmail("");
      setFormError("");
      dispatch(showToast("Org contact added."));
      await queryClient.invalidateQueries({ queryKey: queryKeys.entityDirectory(entityId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.directoryStats });
    },
    onError(err) {
      setFormError(err instanceof Error ? err.message : "Could not add that org contact.");
    },
  });

  const remove = useMutation({
    mutationFn: reportingApi.removeOrgContact,
    async onSuccess() {
      dispatch(showToast("Org contact removed."));
      await queryClient.invalidateQueries({ queryKey: queryKeys.entityDirectory(entityId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.directoryStats });
    },
  });

  const orgContacts = query.data?.orgContacts ?? [];

  return {
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : query.error ? new Error("Failed to load org contacts") : null,
    organizationName: identity?.organizationName ?? "Organization",
    orgContacts,
    atCapacity: orgContacts.length >= MAX_ORG_CONTACTS,
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
