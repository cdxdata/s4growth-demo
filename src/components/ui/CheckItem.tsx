import { Status } from "@/components/ui/Status";
import { SubmissionBadge } from "@/components/ui/SubmissionBadge";
import type { SubmissionStatus } from "@/types/domain";

export function CheckItem({
  ok,
  label,
  text,
  status,
  selected,
  onSelect,
}: {
  ok?: boolean;
  label: string;
  text: string;
  status?: SubmissionStatus;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const complete = status ? status === "Complete" : Boolean(ok);
  const className = `check${selected ? " is-selected" : ""}${onSelect ? " is-button" : ""}`;
  const body = (
    <>
      <div className={`checkmark ${complete ? "g" : "y"}`}>{complete ? "✓" : "!"}</div>
      <div>
        <strong>{label}</strong>
        <small>{text}</small>
      </div>
      {status ? (
        <SubmissionBadge status={status} compact />
      ) : (
        <Status tone={ok ? "complete" : "review"}>{ok ? "Complete" : "Action needed"}</Status>
      )}
    </>
  );

  if (onSelect) {
    return (
      <button type="button" className={className} onClick={onSelect} aria-pressed={selected}>
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
}
