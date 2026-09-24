type StatProps = {
  label: string;
  value: string | number;
  note: string;
  tone?: "warn" | "bad" | "";
};

export function Stat({ label, value, note, tone = "" }: StatProps) {
  const prefix = tone === "warn" || tone === "bad" ? "● " : "↑ ";
  return (
    <div className="stat">
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      <div className={`delta ${tone}`}>
        {prefix}
        {note}
      </div>
    </div>
  );
}
