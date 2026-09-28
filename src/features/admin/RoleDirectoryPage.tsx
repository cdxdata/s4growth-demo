import { useState, type FormEvent } from "react";
import { Header } from "@/components/layout/Header";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { MAX_USERS, useRoleDirectory } from "@/features/admin/useRoleDirectory";

function UserForm({
  disabled,
  onAdd,
}: {
  disabled: boolean;
  onAdd: (name: string, email: string) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function submit(event: FormEvent) {
    event.preventDefault();
    onAdd(name, email);
    setName("");
    setEmail("");
  }

  return (
    <form className="inline-form" onSubmit={submit}>
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" required />
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Email"
        required
      />
      <button className="btn secondary" type="submit" disabled={disabled}>
        Add user
      </button>
    </form>
  );
}

export function RoleDirectoryPage() {
  const summary = useRoleDirectory();

  return (
    <>
      <Header title={summary.title} subtitle="Add or remove organizations and their users." />
      <button className="back" onClick={summary.goBack}>
        ← Directory
      </button>
      <QueryState isLoading={summary.isLoading} error={summary.error}>
        <Panel>
          <Panel.Head>
            <Panel.Title title="Add organization" subtitle="Only a name and email are required." />
          </Panel.Head>
          <form className="directory-form" onSubmit={summary.addEntity}>
            {summary.formError ? <div className="notice error">{summary.formError}</div> : null}
            <input value={summary.name} onChange={(event) => summary.setName(event.target.value)} placeholder="Name" required />
            <input
              type="email"
              value={summary.email}
              onChange={(event) => summary.setEmail(event.target.value)}
              placeholder="Email"
              required
            />
            <button className="btn primary" type="submit" disabled={summary.isSaving}>
              Add
            </button>
          </form>
        </Panel>
        <div className="directory-list">
          {summary.entities.map((entity) => {
            const atCap = entity.users.length >= MAX_USERS;
            return (
              <Panel key={entity.id}>
                <Panel.Head>
                  <Panel.Title title={entity.name} subtitle={entity.email} />
                  <button className="link" type="button" onClick={() => summary.removeEntity(entity.id)}>
                    Remove
                  </button>
                </Panel.Head>
                {summary.allowsUsers ? (
                  <div className="user-block">
                    <div className="user-label">
                      Users ({entity.users.length}/{MAX_USERS})
                    </div>
                    {entity.users.length === 0 ? (
                      <div className="empty-inline">No users yet.</div>
                    ) : (
                      entity.users.map((user) => (
                        <div className="user-row" key={user.id}>
                          <div>
                            <strong>{user.name}</strong>
                            <span>{user.email}</span>
                          </div>
                          <button className="link" type="button" onClick={() => summary.removeUser(user.id)}>
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                    {atCap ? (
                      <div className="helper">This organization already has four users.</div>
                    ) : (
                      <UserForm disabled={false} onAdd={(name, email) => summary.addUser(entity.id, name, email)} />
                    )}
                  </div>
                ) : (
                  <div className="user-block">
                    <div className="empty-inline">Admin accounts cannot have users.</div>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      </QueryState>
    </>
  );
}
