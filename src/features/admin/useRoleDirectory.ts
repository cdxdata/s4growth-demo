import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { ROLE_LABELS, ROLE_PLURALS } from "@/constants/roles";
import { showToast } from "@/store/uiSlice";
import { useAppDispatch } from "@/app/hooks";
import { APP_ROLES, MAX_REPRESENTATIVES, type AppRole, type DirectoryEntity, type Representative } from "@/types/auth";

export type RoleDirectorySummary = {
  isLoading: boolean;
  error: Error | null;
  role: AppRole;
  title: string;
  allowsRepresentatives: boolean;
  entities: Array<DirectoryEntity & { representatives: Representative[] }>;
  name: string;
  email: string;
  formError: string;
  isSaving: boolean;
  setName: (value: string) => void;
  setEmail: (value: string) => void;
  addEntity: (event: FormEvent) => void;
  removeEntity: (id: string) => void;
  addRepresentative: (entityId: string, name: string, email: string) => void;
  removeRepresentative: (id: string) => void;
  goBack: () => void;
};

function isAppRole(value: string | undefined): value is AppRole {
  return Boolean(value && (APP_ROLES as readonly string[]).includes(value));
}

export function useRoleDirectory(): RoleDirectorySummary {
  const { role: roleParam } = useParams();
  const role: AppRole = isAppRole(roleParam) ? roleParam : "training-provider";
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");

  const query = useQuery({
    queryKey: queryKeys.roleDirectory(role),
    queryFn: () => reportingApi.listRoleDirectory(role),
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.roleDirectory(role) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.directoryStats });
  };

  const addEntity = useMutation({
    mutationFn: () => reportingApi.addEntity(role, name, email),
    async onSuccess() {
      setName("");
      setEmail("");
      setFormError("");
      dispatch(showToast(`${ROLE_LABELS[role]} added.`));
      await invalidate();
    },
    onError(err) {
      setFormError(err instanceof Error ? err.message : "Could not add that organization.");
    },
  });

  const removeEntity = useMutation({
    mutationFn: reportingApi.removeEntity,
    async onSuccess() {
      dispatch(showToast("Organization removed."));
      await invalidate();
    },
    onError(err) {
      dispatch(showToast(err instanceof Error ? err.message : "Could not remove that organization."));
    },
  });

  const addRep = useMutation({
    mutationFn: ({ entityId, name: repName, email: repEmail }: { entityId: string; name: string; email: string }) =>
      reportingApi.addRepresentative(entityId, repName, repEmail),
    async onSuccess() {
      dispatch(showToast("Representative added."));
      await invalidate();
    },
    onError(err) {
      dispatch(showToast(err instanceof Error ? err.message : "Could not add that representative."));
    },
  });

  const removeRep = useMutation({
    mutationFn: reportingApi.removeRepresentative,
    async onSuccess() {
      dispatch(showToast("Representative removed."));
      await invalidate();
    },
  });

  return {
    isLoading: query.isLoading,
    error: query.error instanceof Error ? query.error : query.error ? new Error("Failed to load directory") : null,
    role,
    title: ROLE_PLURALS[role],
    allowsRepresentatives: role !== "admin",
    entities: query.data ?? [],
    name,
    email,
    formError,
    isSaving: addEntity.isPending,
    setName,
    setEmail,
    addEntity(event) {
      event.preventDefault();
      addEntity.mutate();
    },
    removeEntity: (id) => removeEntity.mutate(id),
    addRepresentative: (entityId, repName, repEmail) => addRep.mutate({ entityId, name: repName, email: repEmail }),
    removeRepresentative: (id) => removeRep.mutate(id),
    goBack: () => navigate("/"),
  };
}

export { MAX_REPRESENTATIVES };
