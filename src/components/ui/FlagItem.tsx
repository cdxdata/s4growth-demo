import { Status } from "@/components/ui/Status";
import type { ReviewFlag } from "@/types/domain";

export function FlagItem({
  flag,
  onAction,
}: {
  flag: ReviewFlag;
  onAction: (flag: ReviewFlag) => void;
}) {
  return (
    <div className="flag">
      <div className="flag-icon">!</div>
      <div>
        <h3>{flag.title}</h3>
        <p>{flag.text}</p>
        <Status tone="review">{flag.tag}</Status>
      </div>
      <div className="flag-meta">
        <small>{flag.date}</small>
        <button className="link" onClick={() => onAction(flag)}>
          {flag.actionText} →
        </button>
      </div>
    </div>
  );
}
