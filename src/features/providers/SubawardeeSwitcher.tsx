import { SubmissionBadge } from "@/components/ui/SubmissionBadge";
import type { SubawardeeSwitcherSummary } from "@/features/providers/useSubawardeeSwitcher";

export function SubawardeeSwitcher({ summary }: { summary: SubawardeeSwitcherSummary }) {
  return (
    <div className="subawardee-switcher" ref={summary.containerRef}>
      <button
        type="button"
        className="subawardee-switcher-btn"
        aria-haspopup="listbox"
        aria-expanded={summary.isOpen}
        aria-label="Switch subawardee"
        onClick={summary.toggle}
      >
        <span aria-hidden="true">{summary.isOpen ? "▴" : "▾"}</span>
      </button>
      {summary.isOpen ? (
        <div className="subawardee-menu" role="listbox" aria-label="Subawardees">
          <div className="subawardee-search">
            <input
              ref={summary.searchRef}
              type="search"
              value={summary.query}
              placeholder="Search subawardee"
              aria-label="Search subawardee"
              onChange={(event) => summary.setQuery(event.target.value)}
            />
          </div>
          <div className="subawardee-options">
            {summary.isLoading ? (
              <div className="subawardee-empty">Loading subawardees…</div>
            ) : summary.options.length ? (
              summary.options.map((option) => {
                const selected = option.id === summary.current?.id;
                return (
                  <button
                    key={option.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`subawardee-option${selected ? " selected" : ""}`}
                    onClick={() => summary.choose(option.id)}
                  >
                    <span className="subawardee-option-copy">
                      <b>{option.name}</b>
                      <span className="category-chip">{option.category}</span>
                    </span>
                    <SubmissionBadge status={option.submissionStatus} compact />
                  </button>
                );
              })
            ) : (
              <div className="subawardee-empty">No matching subawardees.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
