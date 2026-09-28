import { Header } from "@/components/layout/Header";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { useUsers } from "@/features/account/useUsers";
import { MAX_USERS } from "@/types/auth";

export function UsersPage() {
  const summary = useUsers();

  return (
    <>
      <Header
        title="Users"
        subtitle={`People who can sign in and work in the ${summary.organizationName} workspace.`}
      />
      <QueryState isLoading={summary.isLoading} error={summary.error}>
        <Panel>
          <Panel.Head>
            <Panel.Title
              title={`${summary.users.length}/${MAX_USERS} users`}
              subtitle="Up to four staff can share this organization's access."
            />
          </Panel.Head>
          {summary.users.length === 0 ? (
            <div className="empty-inline" style={{ padding: 16 }}>
              No users yet.
            </div>
          ) : (
            summary.users.map((user) => (
              <div className="user-row" key={user.id}>
                <div>
                  <strong>{user.name}</strong>
                  <span>{user.email}</span>
                </div>
                <button className="link" type="button" onClick={() => summary.remove(user.id)}>
                  Remove
                </button>
              </div>
            ))
          )}
        </Panel>
        <Panel>
          <Panel.Head>
            <Panel.Title title="Add a user" subtitle="Name and email only." />
          </Panel.Head>
          {summary.atCapacity ? (
            <div className="user-block">This organization already has four users.</div>
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
                Add user
              </button>
            </form>
          )}
        </Panel>
      </QueryState>
    </>
  );
}
