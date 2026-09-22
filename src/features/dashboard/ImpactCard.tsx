import type { DashboardImpactCard } from "@/features/dashboard/useDashboard";

function TrendMark({ trend }: { trend: "up" | "down" }) {
  return (
    <svg
      className={`impact-trend ${trend}`}
      viewBox="0 0 12 12"
      width="12"
      height="12"
      aria-label={trend === "up" ? "Improvement" : "Slippage"}
    >
      {trend === "up" ? <path d="M6 1.75 L11.25 10.25 H.75 Z" /> : <path d="M6 10.25 L.75 1.75 H11.25 Z" />}
    </svg>
  );
}

function InfoMark() {
  return (
    <svg className="impact-info" viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
      <circle className="impact-info-disc" cx="8" cy="8" r="7" />
      <circle className="impact-info-cut" cx="8" cy="5.05" r="1.05" />
      <rect className="impact-info-cut" x="7.15" y="7.15" width="1.7" height="4.55" rx="0.85" />
    </svg>
  );
}

export function ImpactCard({ card }: { card: DashboardImpactCard }) {
  return (
    <div className="impact-card">
      <div className="impact-head">
        <div className="impact-label">{card.label}</div>
        <div className="impact-badge">{card.badge}</div>
      </div>
      <div className="impact-compare">
        <div className="impact-side">
          <b>{card.before}</b>
          <span className="impact-caption">{card.leftCaption}</span>
        </div>
        <span className="impact-arrow" aria-hidden="true">
          →
        </span>
        <div className="impact-side">
          <div className="impact-result">
            <b>{card.after}</b>
            {card.trend ? <TrendMark trend={card.trend} /> : null}
          </div>
          <span className="impact-caption">{card.rightCaption}</span>
        </div>
      </div>
      <div className="impact-foot">
        <InfoMark />
        <span>{card.footnote}</span>
      </div>
    </div>
  );
}
