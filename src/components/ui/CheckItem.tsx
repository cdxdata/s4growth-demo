import { Status } from "@/components/ui/Status";

export function CheckItem({ ok, label, text }: { ok: boolean; label: string; text: string }) {
  return (
    <div className="check">
      <div className={`checkmark ${ok ? "g" : "y"}`}>{ok ? "✓" : "!"}</div>
      <div>
        <strong>{label}</strong>
        <small>{text}</small>
      </div>
      <Status tone={ok ? "complete" : "review"}>{ok ? "Complete" : "Action needed"}</Status>
    </div>
  );
}
