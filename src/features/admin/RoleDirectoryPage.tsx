import { useState, type FormEvent } from "react";
import { Header } from "@/components/layout/Header";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { MAX_ORG_CONTACTS, useRoleDirectory } from "@/features/admin/useRoleDirectory";

function OrgContactForm({
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
        Add org contact
      </button>
    </form>
  );
}

export function RoleDirectoryPage() {
  const summary = useRoleDirectory();

  return (
    <>
      <Header title={summary.title} subtitle="Add or remove organizations and their org contacts." />
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
            const atCap = entity.orgContacts.length >= MAX_ORG_CONTACTS;
            return (
              <Panel key={entity.id}>
                <Panel.Head>
                  <Panel.Title title={entity.name} subtitle={entity.email} />
                  <button className="link" type="button" onClick={() => summary.removeEntity(entity.id)}>
                    Remove
                  </button>
                </Panel.Head>
                {summary.allowsOrgContacts ? (
                  <div className="org-contact-block">
                    <div className="org-contact-label">
                      Org contacts ({entity.orgContacts.length}/{MAX_ORG_CONTACTS})
                    </div>
                    {entity.orgContacts.length === 0 ? (
                      <div className="empty-inline">No org contacts yet.</div>
                    ) : (
                      entity.orgContacts.map((contact) => (
                        <div className="org-contact-row" key={contact.id}>
                          <div>
                            <strong>{contact.name}</strong>
                            <span>{contact.email}</span>
                          </div>
                          <button className="link" type="button" onClick={() => summary.removeOrgContact(contact.id)}>
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                    {atCap ? (
                      <div className="helper">This organization already has four org contacts.</div>
                    ) : (
                      <OrgContactForm disabled={false} onAdd={(name, email) => summary.addOrgContact(entity.id, name, email)} />
                    )}
                  </div>
                ) : (
                  <div className="org-contact-block">
                    <div className="empty-inline">Admin accounts cannot have org contacts.</div>
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
