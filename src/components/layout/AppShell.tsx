import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/layout/Sidebar";
import { Toast } from "@/components/ui/Toast";

export function AppShell() {
  return (
    <div className="app">
      <Sidebar />
      <main>
        <Outlet />
      </main>
      <Toast />
    </div>
  );
}
