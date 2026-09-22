import { Header } from "@/components/layout/Header";
import { QueryState } from "@/components/ui/QueryState";
import { useAdminDashboard } from "@/features/admin/useAdminDashboard";
import type { AdminRoleCard } from "@/features/admin/useAdminDashboard";

function RoleCard({ card, onOpen }: { card: AdminRoleCard; onOpen: () => void }) {
  return (
    <button type="button" className="role-card" onClick={onOpen}>
      <div className="role-card-label">{card.title}</div>
      <div className="role-card-count">{card.entityCount}</div>
      <div className="role-card-note">{card.entityCount === 1 ? "entity" : "entities"}</div>
      {card.role !== "admin" ? (
        <div className="role-card-reps">
          {card.representativeCount} {card.representativeCount === 1 ? "representative" : "representatives"}
        </div>
      ) : (
        <div className="role-card-reps">No representatives</div>
      )}
    </button>
  );
}

export function AdminDashboardPage() {
  const summary = useAdminDashboard();

  return (
    <>
      <Header title="Workspace directory" subtitle="Entities and representatives by role." />
      <QueryState isLoading={summary.isLoading} error={summary.error}>
        <div className="role-tier">
          {summary.tierOne.map((card) => (
            <RoleCard key={card.role} card={card} onOpen={() => summary.openRole(card.role)} />
          ))}
        </div>
        <hr className="role-divider" />
        <div className="role-tier three">
          {summary.tierTwo.map((card) => (
            <RoleCard key={card.role} card={card} onOpen={() => summary.openRole(card.role)} />
          ))}
        </div>
      </QueryState>
    </>
  );
}
