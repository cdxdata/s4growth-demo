import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toast } from "@/components/ui/Toast";

export function AppShell() {
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setNavOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    document.body.classList.toggle("nav-locked", navOpen);
    return () => document.body.classList.remove("nav-locked");
  }, [navOpen]);

  return (
    <div className={`app${navOpen ? " is-nav-open" : ""}`}>
      <header className="app-bar">
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={navOpen}
          aria-controls="app-sidebar"
          onClick={() => setNavOpen((open) => !open)}
        >
          <span className="nav-toggle-bars" aria-hidden="true" />
          <span className="sr-only">{navOpen ? "Close menu" : "Open menu"}</span>
        </button>
        <div className="app-bar-brand">
          <div className="mark">S4</div>
          <strong>Steps4Growth</strong>
        </div>
      </header>
      <button type="button" className="nav-backdrop" hidden={!navOpen} aria-label="Close menu" onClick={() => setNavOpen(false)} />
      <Sidebar onNavigate={() => setNavOpen(false)} />
      <main>
        <Outlet />
      </main>
      <Toast />
    </div>
  );
}
