import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { reportingApi } from "@/api/client";
import { queryKeys } from "@/api/queryKeys";
import { useAppSelector } from "@/app/hooks";
import { providerCategoryShort } from "@/lib/providerScope";
import type { SubmissionStatus } from "@/types/domain";

export type SubawardeeOption = {
  id: number;
  name: string;
  category: string;
  submissionStatus: SubmissionStatus;
};

export type SubawardeeSwitcherSummary = {
  isOpen: boolean;
  isLoading: boolean;
  query: string;
  options: SubawardeeOption[];
  current: SubawardeeOption | null;
  containerRef: RefObject<HTMLDivElement>;
  searchRef: RefObject<HTMLInputElement>;
  toggle: () => void;
  setQuery: (value: string) => void;
  choose: (id: number) => void;
};

export function useSubawardeeSwitcher(currentId: number): SubawardeeSwitcherSummary {
  const navigate = useNavigate();
  const location = useLocation();
  const periodId = useAppSelector((state) => state.workspace.selectedPeriodId);
  const storedStatuses = useAppSelector((state) => state.submissions.providerStatus[periodId] ?? {});
  const dashboard = useQuery({
    queryKey: queryKeys.dashboard(periodId),
    queryFn: () => reportingApi.getDashboard(periodId),
  });

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const options = useMemo<SubawardeeOption[]>(() => {
    const list = (dashboard.data?.providers ?? []).map((provider) => ({
      id: provider.id,
      name: provider.name,
      category: providerCategoryShort(provider.type),
      submissionStatus: storedStatuses[String(provider.id)]?.status ?? provider.submissionStatus,
    }));
    const needle = query.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((item) => item.name.toLowerCase().includes(needle));
  }, [dashboard.data?.providers, query, storedStatuses]);

  const current = useMemo(() => {
    const list = dashboard.data?.providers ?? [];
    const match = list.find((item) => item.id === currentId);
    if (!match) return null;
    return {
      id: match.id,
      name: match.name,
      category: providerCategoryShort(match.type),
      submissionStatus: storedStatuses[String(match.id)]?.status ?? match.submissionStatus,
    };
  }, [currentId, dashboard.data?.providers, storedStatuses]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      searchRef.current?.focus();
    } else {
      setQuery("");
    }
  }, [isOpen]);

  return {
    isOpen,
    isLoading: dashboard.isLoading && !dashboard.data,
    query,
    options,
    current,
    containerRef,
    searchRef,
    toggle: () => setIsOpen((open) => !open),
    setQuery,
    choose(id) {
      setIsOpen(false);
      setQuery("");
      if (id !== currentId) navigate({ pathname: `/providers/${id}`, search: location.search });
    },
  };
}
