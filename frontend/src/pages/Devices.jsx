import { useEffect, useState } from "react";
import api from "../api/client";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

const emptyDevice = { name: "", nickname: "", boxphone: "", status: "activo", notes: "", proxy_id: "" };
const emptyProxy = { label: "", provider: "", ip: "", port: "", username: "",
                     password: "", protocol: "http", status: "operativo", notes: "" };

export default function Devices() {
  const { can } = useAuth();
  const [devices, setDevices] = useState([]);
  const [proxies, setProxies] = useState([]);
  const [devForm, setDevForm] = useState(null);   // null cerrado, obj abierto
  const [proxForm, setProxForm] = useState(null);

  function load() {
    api.get("/devices").then((r) => setDevices(r.data));
    api.get("/proxies").then((r) => setProxies(r.data));
  }
  useEffect(load, []);

  const usedProxyIds = new Set(devices.filter((d) => d.proxy).map((d) => d.proxy.id));

  async function saveDevice() {
    const body = { ...devForm, proxy_id: devForm.proxy_id ? Number(devForm.proxy_id) : null };
    try {
      if (devForm.id) await api.put(`/devices/${devForm.id}`, body);
      else await api.post("/devices", body);
      setDevForm(null); load();
    } catch (e) { alert(e.response?.data?.detail || "Error"); }
  }

  async function saveProxy() {
    const body = { ...proxForm, port: Number(proxForm.port) };
    try {
      if (proxForm.id) await api.put(`/proxies/${proxForm.id}`, body);
      else await api.post("/proxies", body);
      setProxForm(null); load();
    } catch (e) { alert(e.response?.data?.detail || "Error"); }
  }

  async function editProxy(p) {
    // trae password descifrada para editar
    const r = await api.get(`/proxies/${p.id}`);
    setProxForm({ ...r.data, password: r.data.password || "" });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Proxys por celular</h1>
        {can.edit && (
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => setProxForm({ ...emptyProxy })}>+ Proxy</button>
            <button className="btn-primary" onClick={() => setDevForm({ ...emptyDevice })}>+ Celular</button>
          </div>
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {devices.map((d) => (
          <div key={d.id} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">
                {d.name}
                {d.nickname && <span className="ml-2 chip bg-hive-panel2 text-hive-muted">{d.nickname}</span>}
                {d.boxphone && <span className="ml-2 chip bg-hive-panel2 text-hive-muted">{d.boxphone}</span>}
              </div>
              <StatusBadge status={d.status} />
            </div>
            {d.proxy ? (
              <div className="text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-hive-muted">Proxy</span>
                  <StatusBadge status={d.proxy.status} />
                </div>
                <div className="font-mono text-xs text-hive-text">{d.proxy.ip}:{d.proxy.port}</div>
                <div className="text-xs text-hive-muted">{d.proxy.provider || "—"} · {d.proxy.protocol}</div>
              </div>
            ) : (
              <div className="text-sm text-bad">Sin proxy asignada</div>
            )}
            <div className="text-xs text-hive-muted mt-2">{d.account_count} cuentas</div>
            {can.edit && (
              <div className="flex gap-2 mt-3">
                <button className="btn-ghost text-xs" onClick={() => setDevForm({
                  id: d.id, name: d.name, nickname: d.nickname || "", boxphone: d.boxphone || "",
                  status: d.status, notes: d.notes || "", proxy_id: d.proxy?.id || "" })}>Editar celular</button>
                {d.proxy && (
                  <button className="btn-ghost text-xs" onClick={() => editProxy(d.proxy)}>Editar proxy</button>
                )}
              </div>
            )}
          </div>
        ))}
        {devices.length === 0 && (
          <p className="text-hive-muted col-span-full py-10 text-center">
            No hay celulares. {can.edit && "Crea un proxy y luego un celular que lo use."}
          </p>
        )}
      </div>

      {/* Proxys sin asignar */}
      {proxies.some((p) => !usedProxyIds.has(p.id)) && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-hive-muted mb-2">Proxys sin celular asignado</h2>
          <div className="flex flex-wrap gap-2">
            {proxies.filter((p) => !usedProxyIds.has(p.id)).map((p) => (
              <button key={p.id} onClick={() => can.edit && editProxy(p)}
                className="card px-3 py-2 text-xs font-mono flex items-center gap-2">
                {p.ip}:{p.port} <StatusBadge status={p.status} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Modal celular */}
      {devForm && (
        <Modal title={devForm.id ? "Editar celular" : "Nuevo celular"} onClose={() => setDevForm(null)} onSave={saveDevice}>
          <label className="label">Nombre</label>
          <input className="input mb-3" value={devForm.name} onChange={(e) => setDevForm({ ...devForm, name: e.target.value })} />
          <label className="label">Alias corto (opcional, ej. "9KL")</label>
          <input className="input mb-3" value={devForm.nickname} onChange={(e) => setDevForm({ ...devForm, nickname: e.target.value })} />
          <label className="label">Boxphone (opcional, ej. "Boxphone 1")</label>
          <input className="input mb-3" value={devForm.boxphone} onChange={(e) => setDevForm({ ...devForm, boxphone: e.target.value })} />
          <label className="label">Estado</label>
          <select className="input mb-3" value={devForm.status} onChange={(e) => setDevForm({ ...devForm, status: e.target.value })}>
            {["activo", "inactivo", "suspendido", "en_revision"].map((s) => <option key={s}>{s}</option>)}
          </select>
          <label className="label">Proxy asignada (única por celular)</label>
          <select className="input mb-3" value={devForm.proxy_id} onChange={(e) => setDevForm({ ...devForm, proxy_id: e.target.value })}>
            <option value="">— sin asignar —</option>
            {proxies.filter((p) => !usedProxyIds.has(p.id) || p.id === devForm.proxy_id).map((p) => (
              <option key={p.id} value={p.id}>{p.ip}:{p.port} ({p.status})</option>
            ))}
          </select>
        </Modal>
      )}

      {/* Modal proxy */}
      {proxForm && (
        <Modal title={proxForm.id ? "Editar proxy" : "Nuevo proxy"} onClose={() => setProxForm(null)} onSave={saveProxy}>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">IP</label><input className="input" value={proxForm.ip} onChange={(e) => setProxForm({ ...proxForm, ip: e.target.value })} /></div>
            <div><label className="label">Puerto</label><input className="input" value={proxForm.port} onChange={(e) => setProxForm({ ...proxForm, port: e.target.value })} /></div>
            <div><label className="label">Usuario</label><input className="input" value={proxForm.username || ""} onChange={(e) => setProxForm({ ...proxForm, username: e.target.value })} /></div>
            <div><label className="label">Contraseña</label><input className="input" value={proxForm.password || ""} onChange={(e) => setProxForm({ ...proxForm, password: e.target.value })} /></div>
            <div><label className="label">Proveedor</label><input className="input" value={proxForm.provider || ""} onChange={(e) => setProxForm({ ...proxForm, provider: e.target.value })} /></div>
            <div><label className="label">Protocolo</label>
              <select className="input" value={proxForm.protocol} onChange={(e) => setProxForm({ ...proxForm, protocol: e.target.value })}>
                <option>http</option><option>socks5</option>
              </select></div>
          </div>
          <label className="label mt-3">Estado</label>
          <select className="input" value={proxForm.status} onChange={(e) => setProxForm({ ...proxForm, status: e.target.value })}>
            <option value="operativo">operativo (verde)</option>
            <option value="inoperativo">inoperativo (rojo)</option>
          </select>
        </Modal>
      )}
    </div>
  );
}

function Modal({ title, children, onClose, onSave }) {
  return (
    <div className="fixed inset-0 bg-black/70 grid place-items-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        {children}
        <div className="flex justify-end gap-2 mt-5">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={onSave}>Guardar</button>
        </div>
      </div>
    </div>
  );
}
