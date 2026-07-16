import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import BrandMark from "../components/BrandMark";

export default function Login() {
  const { login, user } = useAuth();
  const nav = useNavigate();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) { nav("/accounts", { replace: true }); return null; }

  async function submit(e) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      await login(u, p);
      nav("/accounts", { replace: true });
    } catch {
      setErr("Usuario o contraseña incorrectos");
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form onSubmit={submit} className="card p-8 w-full max-w-sm">
        <div className="flex items-center gap-2 font-mono font-extrabold uppercase tracking-wide text-lg mb-1">
          <BrandMark size={26} /> Hack the Accounts
        </div>
        <p className="text-hive-muted text-sm mb-6">Acceso interno HTH</p>
        <label className="label">Usuario</label>
        <input className="input mb-4" value={u} onChange={(e) => setU(e.target.value)} autoFocus />
        <label className="label">Contraseña</label>
        <input className="input mb-4" type="password" value={p} onChange={(e) => setP(e.target.value)} />
        {err && <p className="text-bad text-sm mb-3">{err}</p>}
        <button className="btn-primary w-full justify-center" disabled={busy}>
          {busy ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
