import { useEffect, useRef, useState, type RefObject } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { getPeriodById, REPORTING_PERIODS, type ReportingPeriod } from "@/constants/periods";
import { selectPeriod } from "@/store/workspaceSlice";

export type PeriodSelectorSummary = {
  isOpen: boolean;
  selected: ReportingPeriod;
  options: ReportingPeriod[];
  containerRef: RefObject<HTMLDivElement>;
  toggle: () => void;
  close: () => void;
  choose: (periodId: string) => void;
};

export function usePeriodSelector(): PeriodSelectorSummary {
  const dispatch = useAppDispatch();
  const selectedPeriodId = useAppSelector((state) => state.workspace.selectedPeriodId);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  return {
    isOpen,
    selected: getPeriodById(selectedPeriodId),
    options: REPORTING_PERIODS,
    containerRef,
    toggle: () => setIsOpen((open) => !open),
    close: () => setIsOpen(false),
    choose(periodId) {
      dispatch(selectPeriod(periodId));
      setIsOpen(false);
    },
  };
}
