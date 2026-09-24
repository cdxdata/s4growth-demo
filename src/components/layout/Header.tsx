import { PeriodSelect } from "@/components/layout/PeriodSelect";
import { useAppSelector } from "@/app/hooks";

export function Header({
  title,
  subtitle,
  hidePeriod,
}: {
  title: string;
  subtitle?: string;
  hidePeriod?: boolean;
}) {
  const role = useAppSelector((state) => state.auth.identity?.role);
  const showPeriod =
    !hidePeriod && (role === "project-manager" || role === "training-provider" || role === "backbone");

  return (
    <header className="topbar">
      <div>
        <div className="eyebrow">Steps4Growth · synthetic demo</div>
        <h1>{title}</h1>
        {subtitle ? (
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>{subtitle}</div>
        ) : null}
      </div>
      {showPeriod ? <PeriodSelect /> : null}
    </header>
  );
}
