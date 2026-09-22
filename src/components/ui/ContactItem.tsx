export function ContactItem({
  initials,
  name,
  role,
}: {
  initials: string;
  name: string;
  role: string;
}) {
  return (
    <div className="contact">
      <div className="circle">{initials}</div>
      <div>
        <b>{name}</b>
        <span>{role}</span>
      </div>
    </div>
  );
}
