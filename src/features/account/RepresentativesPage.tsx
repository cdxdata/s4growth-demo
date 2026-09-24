import { Header } from "@/components/layout/Header";
import { Panel } from "@/components/ui/Panel";
import { QueryState } from "@/components/ui/QueryState";
import { useRepresentatives } from "@/features/account/useRepresentatives";
import { MAX_REPRESENTATIVES } from "@/types/auth";

export function RepresentativesPage() {
  const summary = useRepresentatives();

  return (
    <>
      <Header
        title="Representatives"
        subtitle={`People who can sign in and work in the ${summary.organizationName} workspace.`}
      />
      <QueryState isLoading={summary.isLoading} error={summary.error}>
        <Panel>
          <Panel.Head>
            <Panel.Title
              title={`${summary.representatives.length}/${MAX_REPRESENTATIVES} representatives`}
              subtitle="Up to four staff can share this organization's access."
            />
          </Panel.Head>
          {summary.representatives.length === 0 ? (
            <div className="empty-inline" style={{ padding: 16 }}>
              No representatives yet.
            </div>
          ) : (
            summary.representatives.map((rep) => (
              <div className="rep-row" key={rep.id}>
                <div>
                  <strong>{rep.name}</strong>
                  <span>{rep.email}</span>
                </div>
                <button className="link" type="button" onClick={() => summary.remove(rep.id)}>
                  Remove
                </button>
              </div>
            ))
          )}
        </Panel>
        <Panel>
          <Panel.Head>
            <Panel.Title title="Add a representative" subtitle="Name and email only." />
          </Panel.Head>
          {summary.atCapacity ? (
            <div className="rep-block">This organization already has four representatives.</div>
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
                Add representative
              </button>
            </form>
          )}
        </Panel>
      </QueryState>
    </>
  );
}
