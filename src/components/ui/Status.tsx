import type { StatusTone } from "@/types/domain";
import type { ReactNode } from "react";

export function Status({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return <span className={`status ${tone}`}>{children}</span>;
}
