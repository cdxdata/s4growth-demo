import { PeriodSelect } from "@/components/layout/PeriodSelect";

export function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">Steps4Growth · synthetic demo</div>
        <h1>{title}</h1>
        {subtitle ? (
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{subtitle}</div>
        ) : null}
      </div>
      <PeriodSelect />
    </header>
  );
}
