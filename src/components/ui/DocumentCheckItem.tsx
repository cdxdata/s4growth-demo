import type { OverviewDocumentTone } from "@/lib/overviewDocuments";

function Icon({ tone }: { tone: OverviewDocumentTone }) {
  if (tone === "complete") {
    return (
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path fill="currentColor" d="M9.3 16.3 4.7 11.7l1.4-1.4 3.2 3.2 8.2-8.2 1.4 1.4z" />
      </svg>
    );
  }
  if (tone === "review") {
    return (
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 4a8 8 0 1 0 8 8h-2a6 6 0 1 1-6-6V4zm1 4v4.2l3.2 1.9-.9 1.5L11 13V8h2z"
        />
      </svg>
    );
  }
  if (tone === "flagged") {
    return (
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path fill="currentColor" d="M6 3h2v18H6zm3 1 9 4.5L9 13V4z" />
      </svg>
    );
  }
  if (tone === "incomplete") {
    return (
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
        <path fill="currentColor" d="M12 3 2 21h20L12 3zm0 6 6.2 11H5.8L12 9zm-1 3h2v4h-2zm0 5h2v2h-2z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path fill="currentColor" d="M7 3h7l5 5v13H7V3zm7 1.5V9h4.5L14 4.5zM9 12h8v2H9zm0 4h8v2H9z" />
    </svg>
  );
}

export function DocumentCheckItem({
  label,
  text,
  tone,
}: {
  label: string;
  text: string;
  tone: OverviewDocumentTone;
}) {
  return (
    <div className="check">
      <div className={`check-icon is-${tone}`}>
        <Icon tone={tone} />
      </div>
      <div>
        <strong>{label}</strong>
        <small>{text}</small>
      </div>
    </div>
  );
}
