export function EventItem({ icon, title, text }: { icon: string; title: string; text: string }) {
  return (
    <div className="event">
      <div className="event-icon">{icon}</div>
      <div>
        <strong>{title}</strong>
        <small>{text}</small>
      </div>
    </div>
  );
}
