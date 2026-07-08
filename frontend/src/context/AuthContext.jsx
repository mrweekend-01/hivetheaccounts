import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("hth_token");
    if (!token) { setLoading(false); return; }
    api.get("/auth/me")
      .then((r) => setUser(r.data))
      .catch(() => localStorage.removeItem("hth_token"))
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const form = new URLSearchParams({ username, password });
    const r = await api.post("/auth/login", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
    localStorage.setItem("hth_token", r.data.access_token);
    const me = await api.get("/auth/me");
    setUser(me.data);
  }

  function logout() {
    localStorage.removeItem("hth_token");
    setUser(null);
    location.href = "/login";
  }

  const can = {
    edit: user && (user.role === "admin" || user.role === "editor"),
    reveal: user && (user.role === "admin" || user.role === "editor"),
    admin: user && user.role === "admin",
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
