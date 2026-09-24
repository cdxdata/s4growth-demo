import type { ReactNode } from "react";

export function QueryState({
  isLoading,
  error,
  children,
}: {
  isLoading: boolean;
  error: Error | null;
  children: ReactNode;
}) {
  if (isLoading) {
    return (
      <div className="empty">
        <b>Loading workspace data…</b>
        <br />
        <span>Fetching the current reporting cycle.</span>
      </div>
    );
  }

  if (error) {
    return <div className="notice error">{error.message || "Something went wrong while loading this view."}</div>;
  }

  return <>{children}</>;
}
