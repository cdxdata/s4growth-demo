type StatProps = {
  label: string;
  value: string | number;
  note: string | string[];
  tone?: "warn" | "bad" | "";
  onClick?: () => void;
};

export function Stat({ label, value, note, tone = "", onClick }: StatProps) {
  const notes = Array.isArray(note) ? note : [note];
  const prefix = tone === "warn" || tone === "bad" ? "● " : "↑ ";
  const className = `stat${onClick ? " is-link" : ""}`;
  const body = (
    <>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      <div className={`delta ${tone}`}>
        {notes.map((line, index) => (
          <span key={`${line}-${index}`}>
            {prefix}
            {line}
          </span>
        ))}
      </div>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
}
