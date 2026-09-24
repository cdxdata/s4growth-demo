import type { FieldMark } from "@/types/submissions";

export function FieldMarks({
  mark,
  interactive,
  onChange,
}: {
  mark?: FieldMark;
  interactive?: boolean;
  onChange?: (mark: FieldMark) => void;
}) {
  return (
    <span className="field-marks" aria-label="Field review marks">
      <button
        type="button"
        className={`field-mark good${mark === "good" ? " is-on" : ""}`}
        disabled={!interactive}
        aria-pressed={mark === "good"}
        aria-label="Mark field correct"
        onClick={() => onChange?.("good")}
      >
        ✓
      </button>
      <button
        type="button"
        className={`field-mark bad${mark === "bad" ? " is-on" : ""}`}
        disabled={!interactive}
        aria-pressed={mark === "bad"}
        aria-label="Mark field incorrect"
        onClick={() => onChange?.("bad")}
      >
        ✗
      </button>
    </span>
  );
}
