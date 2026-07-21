import { useEffect, useState, useCallback } from "react";
import api from "../api/client";
import StatusBadge from "../components/StatusBadge";
import SocialDots from "../components/SocialDots";
import AccountModal from "../components/AccountModal";
import AccountForm from "../components/AccountForm";
import PersonalityPanel from "../components/PersonalityPanel";
import { useAuth } from "../context/AuthContext";

const API = window.__API_URL__ || import.meta.env.VITE_API_URL || "http://localhost:8000";

export default function Accounts() {
  const { can } = useAuth();
  const [rows, setRows] = useState([]);
  const [devices, setDevices] = useState([]);
  const [summary, setSummary] = useState(null);
  const [f, setF] = useState({ platform: "", status: "", device_id: "", boxphone: "", search: "" });
  const [openId, setOpenId] = useState(null);
  const [formFor, setFormFor] = useState(undefined); // undefined=cerrado, null=nuevo, obj=editar
  const [personalityId, setPersonalityId] = useState(null);

  const load = useCallback(() => {
    const params = Object.fromEntries(Object.entries(f).filter(([, v]) => v));
    api.get("/accounts", { params }).then((r) => setRows(r.data));
    api.get("/accounts/summary").then((r) => setSummary(r.data));
  }, [f]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.get("/devices").then((r) => setDevices(r.data)); }, []);

  const boxphones = [...new Set(devices.map((d) => d.boxphone).filter(Boolean))].sort();

  function exportFile(kind) {
    const params = new URLSearchParams(Object.entries(f).filter(([, v]) => v));
    const token = localStorage.getItem("hth_token");
    // descarga con token vía fetch -> blob
    fetch(`${API}/export/accounts.${kind}?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((b) => {
        const url = URL.createObjectURL(b);
        const a = document.createElement("a");
        a.href = url; a.download = `cuentas.${kind}`; a.click();
        URL.revokeObjectURL(url);
      });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Cuentas <span className="text-hive-muted text-sm normal-case tracking-normal font-sans font-semibold">({rows.length})</span></h1>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={() => exportFile("xlsx")}>Exportar Excel</button>
          <button className="btn-ghost" onClick={() => exportFile("csv")}>Exportar CSV</button>
          {can.edit && <button className="btn-primary" onClick={() => setFormFor(null)}>+ Nueva cuenta</button>}
        </div>
      </div>

      {summary && (
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="stat-tile">
            <span className="stat-tile-label">Total cuentas</span>
            <span className="stat-tile-value text-hive-text">{summary.total_accounts}</span>
          </div>
          {[
            { label: "Facebook", tag: "FB", active: summary.facebook_active, pending: summary.facebook_pending },
            { label: "Instagram", tag: "IG", active: summary.instagram_active, pending: summary.instagram_pending },
            { label: "TikTok", tag: "TT", active: summary.tiktok_active, pending: summary.tiktok_pending },
          ].map((p) => (
            <div key={p.tag} className="stat-tile">
              <div className="flex items-center justify-between gap-3">
                <span className="stat-tile-label">{p.label}</span>
                <span className="font-mono text-[10px] font-bold text-hive-muted">{p.tag}</span>
              </div>
              <div className="flex items-end gap-4">
                <div>
                  <div className="stat-tile-value text-ok">{p.active}</div>
                  <div className="stat-tile-sub">activas</div>
                </div>
                <div>
                  <div className="stat-tile-value text-warn">{p.pending}</div>
                  <div className="stat-tile-sub">pendientes</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="card p-3 mb-4 flex flex-wrap gap-3">
        <input className="input flex-1 min-w-[180px]" placeholder="Buscar nombre o correo…"
          value={f.search} onChange={(e) => setF({ ...f, search: e.target.value })} />
        <select className="input w-auto" value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value })}>
          <option value="">Todas las redes</option>
          <option value="facebook">Facebook</option>
          <option value="instagram">Instagram</option>
          <option value="tiktok">TikTok</option>
        </select>
        <select className="input w-auto" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
          <option value="suspendido">Suspendido</option>
          <option value="en_revision">En revisión</option>
        </select>
        <select className="input w-auto" value={f.device_id} onChange={(e) => setF({ ...f, device_id: e.target.value })}>
          <option value="">Todos los celulares</option>
          {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <select className="input w-auto" value={f.boxphone} onChange={(e) => setF({ ...f, boxphone: e.target.value })}>
          <option value="">Todos los boxphones</option>
          {boxphones.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
      </div>

      {/* Tabla */}
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-hive-panel2 text-hive-muted text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Perfil</th>
              <th className="text-left px-4 py-2.5 font-medium">Celular</th>
              <th className="text-left px-4 py-2.5 font-medium">Boxphone</th>
              <th className="text-left px-4 py-2.5 font-medium">Estado</th>
              <th className="text-left px-4 py-2.5 font-medium">Redes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} onClick={() => setOpenId(r.id)}
                className="border-t border-hive-border hover:bg-hive-panel2 cursor-pointer">
                <td className="px-4 py-3">
                  <div className="font-medium">{r.profile_name}</div>
                  {r.corporate_email && <div className="font-mono text-xs text-hive-muted">{r.corporate_email}</div>}
                </td>
                <td className="px-4 py-3 text-hive-muted">{r.device_nickname || r.device_name || "—"}</td>
                <td className="px-4 py-3 text-hive-muted">{r.boxphone || "—"}</td>
                <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                <td className="px-4 py-3"><SocialDots socials={r.socials} /></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-hive-muted">
                No hay cuentas todavía. {can.edit && "Crea la primera con “Nueva cuenta”."}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {openId && (
        <AccountModal accountId={openId} onClose={() => setOpenId(null)}
          onEdit={(acc) => { setOpenId(null); setFormFor(acc); }}
          onPersonality={(acc) => { setOpenId(null); setPersonalityId(acc.id); }} />
      )}
      {formFor !== undefined && (
        <AccountForm account={formFor} devices={devices}
          onClose={() => setFormFor(undefined)}
          onSaved={() => { setFormFor(undefined); load(); }} />
      )}
      {personalityId && (
        <PersonalityPanel accountId={personalityId}
          onClose={() => setPersonalityId(null)}
          onSaved={() => { setPersonalityId(null); load(); }} />
      )}
    </div>
  );
}
