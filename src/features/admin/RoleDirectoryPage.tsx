import { useState, type FormEvent } from "react";
import { Header } from "@/components/layout/Header";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { MAX_REPRESENTATIVES, useRoleDirectory } from "@/features/admin/useRoleDirectory";

function RepresentativeForm({
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
        Add representative
      </button>
    </form>
  );
}

export function RoleDirectoryPage() {
  const summary = useRoleDirectory();

  return (
    <>
      <Header title={summary.title} subtitle="Add or remove organizations and their representatives." />
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
            const atCap = entity.representatives.length >= MAX_REPRESENTATIVES;
            return (
              <Panel key={entity.id}>
                <Panel.Head>
                  <Panel.Title title={entity.name} subtitle={entity.email} />
                  <button className="link" type="button" onClick={() => summary.removeEntity(entity.id)}>
                    Remove
                  </button>
                </Panel.Head>
                {summary.allowsRepresentatives ? (
                  <div className="rep-block">
                    <div className="rep-label">
                      Representatives ({entity.representatives.length}/{MAX_REPRESENTATIVES})
                    </div>
                    {entity.representatives.length === 0 ? (
                      <div className="empty-inline">No representatives yet.</div>
                    ) : (
                      entity.representatives.map((rep) => (
                        <div className="rep-row" key={rep.id}>
                          <div>
                            <strong>{rep.name}</strong>
                            <span>{rep.email}</span>
                          </div>
                          <button className="link" type="button" onClick={() => summary.removeRepresentative(rep.id)}>
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                    {atCap ? (
                      <div className="helper">This organization already has four representatives.</div>
                    ) : (
                      <RepresentativeForm
                        disabled={false}
                        onAdd={(name, email) => summary.addRepresentative(entity.id, name, email)}
                      />
                    )}
                  </div>
                ) : (
                  <div className="rep-block">
                    <div className="empty-inline">Admin accounts cannot have representatives.</div>
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
