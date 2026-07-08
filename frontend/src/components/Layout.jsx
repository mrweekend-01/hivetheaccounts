import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const nav = [
  { to: "/accounts", label: "Cuentas" },
  { to: "/devices", label: "Proxys por celular" },
  { to: "/humanization", label: "Humanización" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-hive-border bg-hive-panel">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
          <div className="flex items-center gap-2 font-bold tracking-tight">
            <span className="text-hive-amber">▲</span> Hack the Accounts
          </div>
          <nav className="flex gap-1">
            {nav.map((n) => (
              <NavLink key={n.to} to={n.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm ${
                    isActive ? "bg-hive-amber text-black font-medium"
                             : "text-hive-muted hover:text-hive-text hover:bg-hive-panel2"}`}>
                {n.label}
              </NavLink>
            ))}
            {user?.role === "admin" && (
              <NavLink to="/users"
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm ${
                    isActive ? "bg-hive-amber text-black font-medium"
                             : "text-hive-muted hover:text-hive-text hover:bg-hive-panel2"}`}>
                Usuarios
              </NavLink>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-hive-muted">
              {user?.full_name || user?.username}
              <span className="ml-2 chip bg-hive-panel2 text-hive-amber uppercase">{user?.role}</span>
            </span>
            <button onClick={logout} className="btn-ghost">Salir</button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
