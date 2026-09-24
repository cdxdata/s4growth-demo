import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "@/app/hooks";
import { clearToast } from "@/store/uiSlice";

export function Toast() {
  const toast = useAppSelector((state) => state.ui.toast);
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => dispatch(clearToast()), 4000);
    return () => window.clearTimeout(timer);
  }, [dispatch, toast]);

  if (!toast) return null;
  return <div className="toast">{toast}</div>;
}
