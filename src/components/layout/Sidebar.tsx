import { NavLink, useLocation } from "react-router-dom";
import { useSidebar } from "@/components/layout/useSidebar";
import { useAppDispatch } from "@/app/hooks";
import { clearIdentity } from "@/store/authSlice";

export function Sidebar() {
  const { items, teamName, teamSubtitle, canSignOut, isItemActive } = useSidebar();
  const location = useLocation();
  const dispatch = useAppDispatch();

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="mark">S4</div>
        <div>
          <strong>Steps4Growth</strong>
          <small>Reporting center</small>
        </div>
      </div>
      <div className="nav-label">Workspace</div>
      <nav className="nav">
        {items.map((item) => (
          <NavLink
            key={item.id}
            to={item.to}
            className={() => (isItemActive(location.pathname, item.id) ? "active" : "")}
            end={item.end}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="side-foot">
        <span className="avatar">{teamName.slice(0, 2).toUpperCase()}</span>
        {teamName}
        <br />
        <span style={{ paddingLeft: 36 }}>{teamSubtitle}</span>
        {canSignOut ? (
          <button className="sign-out" type="button" onClick={() => dispatch(clearIdentity())}>
            Sign out
          </button>
        ) : null}
      </div>
    </aside>
  );
}
