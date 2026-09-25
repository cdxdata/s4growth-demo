function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const second = parts[1]?.[0] ?? parts[0]?.[1] ?? "";
  return `${first}${second}`.toUpperCase();
}

export function ContactItem({
  name,
  email,
}: {
  name: string;
  email: string;
}) {
  return (
    <div className="contact">
      <div className="circle">{initialsFromName(name)}</div>
      <div>
        <b>{name}</b>
        <span>{email}</span>
      </div>
    </div>
  );
}
