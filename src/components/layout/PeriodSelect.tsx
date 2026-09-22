import { usePeriodSelector } from "@/components/layout/usePeriodSelector";

export function PeriodSelect() {
  const summary = usePeriodSelector();

  return (
    <div className="period-select" ref={summary.containerRef}>
      <button
        type="button"
        className={`period ${summary.selected.kind}`}
        aria-haspopup="listbox"
        aria-expanded={summary.isOpen}
        onClick={summary.toggle}
      >
        <span>{summary.selected.label}</span>
        <span className="period-caret" aria-hidden="true">
          {summary.isOpen ? "▴" : "▾"}
        </span>
      </button>
      {summary.isOpen ? (
        <ul className="period-menu" role="listbox" aria-label="Reporting periods">
          {summary.options.map((option) => {
            const selected = option.id === summary.selected.id;
            return (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={`period-option ${option.kind}${selected ? " selected" : ""}`}
                  onClick={() => summary.choose(option.id)}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
