import { Header } from "@/components/layout/Header";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { useOrgContacts } from "@/features/account/useOrgContacts";
import { MAX_ORG_CONTACTS } from "@/types/auth";

export function OrgContactsPage() {
  const summary = useOrgContacts();

  return (
    <>
      <Header
        title="Org contacts"
        subtitle={`People who can sign in and work in the ${summary.organizationName} workspace.`}
      />
      <QueryState isLoading={summary.isLoading} error={summary.error}>
        <Panel>
          <Panel.Head>
            <Panel.Title
              title={`${summary.orgContacts.length}/${MAX_ORG_CONTACTS} org contacts`}
              subtitle="Up to four staff can share this organization's access."
            />
          </Panel.Head>
          {summary.orgContacts.length === 0 ? (
            <div className="empty-inline" style={{ padding: 16 }}>
              No org contacts yet.
            </div>
          ) : (
            summary.orgContacts.map((contact) => (
              <div className="org-contact-row" key={contact.id}>
                <div>
                  <strong>{contact.name}</strong>
                  <span>{contact.email}</span>
                </div>
                <button className="link" type="button" onClick={() => summary.remove(contact.id)}>
                  Remove
                </button>
              </div>
            ))
          )}
        </Panel>
        <Panel>
          <Panel.Head>
            <Panel.Title title="Add an org contact" subtitle="Name and email only." />
          </Panel.Head>
          {summary.atCapacity ? (
            <div className="org-contact-block">This organization already has four org contacts.</div>
          ) : (
            <form className="directory-form" onSubmit={summary.add}>
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
                Add org contact
              </button>
            </form>
          )}
        </Panel>
      </QueryState>
    </>
  );
}
