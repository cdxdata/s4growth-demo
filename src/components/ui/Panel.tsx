import type { ReactNode } from "react";

type PanelProps = {
  children: ReactNode;
  className?: string;
};

function PanelRoot({ children, className = "" }: PanelProps) {
  return <section className={`panel ${className}`.trim()}>{children}</section>;
}

function PanelHead({ children }: { children: ReactNode }) {
  return <div className="panel-head">{children}</div>;
}

function PanelTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h2>{title}</h2>
      {subtitle ? <p>{subtitle}</p> : null}
    </div>
  );
}

export const Panel = Object.assign(PanelRoot, {
  Head: PanelHead,
  Title: PanelTitle,
});
