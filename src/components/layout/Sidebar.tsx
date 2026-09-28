import { NavLink, useLocation } from "react-router-dom";
import { useSidebar } from "@/components/layout/useSidebar";
import { useAppDispatch } from "@/app/hooks";
import { resetDemoWorkspace } from "@/lib/demoReset";
import { clearIdentity } from "@/store/authSlice";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { items, teamName, teamSubtitle, canSignOut, canResetData, isItemActive } = useSidebar();
  const location = useLocation();
  const dispatch = useAppDispatch();

  function confirmReset() {
    const confirmed = window.confirm(
      "Reset all reporting and directory data to the default demonstration state? This cannot be undone.",
    );
    if (!confirmed) return;
    resetDemoWorkspace();
  }

  return (
    <aside className="sidebar" id="app-sidebar">
      <div className="brand">
        <div className="mark">S4</div>
        <div>
          <strong>Steps4Growth</strong>
          <small>Reporting center</small>
        </div>
      </div>
      <div className="nav-label">Workspace</div>
      <nav className="nav" aria-label="Workspace">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            className={() => (isItemActive(location.pathname, item.id) ? "active" : "")}
            end={item.end}
            onClick={onNavigate}
          >
            <span className="icon">{item.icon}</span>
            <span className="nav-text">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="side-foot">
        <div className="side-user">
          <span className="avatar">{teamName.slice(0, 2).toUpperCase()}</span>
          <div className="side-user-copy">
            <strong>{teamName}</strong>
            <span>{teamSubtitle}</span>
          </div>
        </div>
        {canResetData ? (
          <button className="reset-data" type="button" onClick={confirmReset}>
            Reset data
          </button>
        ) : null}
        {canSignOut ? (
          <button className="sign-out" type="button" onClick={() => dispatch(clearIdentity())}>
            Sign out
          </button>
        ) : null}
      </div>
    </aside>
  );
}
