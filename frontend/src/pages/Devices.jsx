import { useEffect, useState } from "react";
import api from "../api/client";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";
import { countryFlag } from "../utils/flags";
import { COUNTRIES, countryName } from "../utils/countries";

const emptyDevice = { name: "", nickname: "", boxphone: "", status: "activo", notes: "" };
const emptyProxy = { label: "", provider: "", ip: "", port: "", username: "",
                     password: "", protocol: "http", status: "operativo", notes: "",
                     country_code: "", device_id: "" };

export default function Devices() {
  const { can } = useAuth();
  const [devices, setDevices] = useState([]);
  const [proxies, setProxies] = useState([]);
  const [search, setSearch] = useState("");
  const [devForm, setDevForm] = useState(null);   // null cerrado, obj abierto
  const [proxForm, setProxForm] = useState(null);

  function load() {
    api.get("/devices").then((r) => setDevices(r.data));
    api.get("/proxies").then((r) => setProxies(r.data));
  }
  useEffect(load, []);

  const usedProxyIds = new Set(devices.flatMap((d) => d.proxies).map((p) => p.id));

  const q = search.trim().toLowerCase();
  const filteredDevices = q
    ? devices.filter((d) => {
        const fields = [d.name, d.nickname, d.boxphone].filter(Boolean).map((s) => s.toLowerCase());
        if (fields.some((f) => f.includes(q))) return true;
        return d.proxies.some((p) => p.ip.toLowerCase().includes(q));
      })
    : devices;

  async function saveDevice() {
    try {
      if (devForm.id) await api.put(`/devices/${devForm.id}`, devForm);
      else await api.post("/devices", devForm);
      setDevForm(null); load();
    } catch (e) { alert(e.response?.data?.detail || "Error"); }
  }

  async function saveProxy() {
    const body = { ...proxForm, port: Number(proxForm.port),
      device_id: proxForm.device_id ? Number(proxForm.device_id) : null };
    try {
      if (proxForm.id) await api.put(`/proxies/${proxForm.id}`, body);
      else await api.post("/proxies", body);
      setProxForm(null); load();
    } catch (e) { alert(e.response?.data?.detail || "Error"); }
  }

  async function editProxy(proxyId, deviceId) {
    // trae password descifrada para editar
    const r = await api.get(`/proxies/${proxyId}`);
    setProxForm({ ...r.data, password: r.data.password || "", device_id: deviceId ?? "" });
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

      <div className="card p-3 mb-4 flex flex-wrap gap-3">
        <input className="input flex-1 min-w-[180px]" placeholder="Buscar celular o proxy…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {filteredDevices.map((d) => {
          const countryNames = [...new Set(
            d.proxies.map((p) => p.country_code).filter(Boolean).map((c) => countryName(c))
          )];
          return (
          <div key={d.id} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="font-semibold">
                {d.name}
                {d.nickname && <span className="ml-2 chip bg-hive-panel2 text-hive-muted">{d.nickname}</span>}
                {d.boxphone && <span className="ml-2 chip bg-hive-panel2 text-hive-muted">{d.boxphone}</span>}
                {countryNames.map((name) => (
                  <span key={name} className="ml-2 chip bg-hive-panel2 text-hive-muted">{name}</span>
                ))}
              </div>
              <StatusBadge status={d.status} />
            </div>
            {d.proxies.length > 0 ? (
              <div className="space-y-2">
                {d.proxies.map((p, i) => (
                  <div key={p.id} className="text-sm border border-hive-border rounded-md p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-hive-muted text-xs">Proxy {i + 1}</span>
                      <StatusBadge status={p.status} />
                    </div>
                    {p.country_code && (
                      <div className="text-xs text-hive-text">
                        {countryFlag(p.country_code)} {countryName(p.country_code)}
                      </div>
                    )}
                    <div className="font-mono text-xs text-hive-text">{p.ip}:{p.port}</div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-hive-muted">{p.provider || "—"} · {p.protocol}</span>
                      {can.edit && (
                        <button className="text-hive-accent text-xs hover:underline"
                          onClick={() => editProxy(p.id, d.id)}>Editar</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-bad">Sin proxy asignada</div>
            )}
            <div className="text-xs text-hive-muted mt-2">{d.account_count} cuentas</div>
            {can.edit && (
              <div className="flex gap-2 mt-3">
                <button className="btn-ghost text-xs" onClick={() => setDevForm({
                  id: d.id, name: d.name, nickname: d.nickname || "", boxphone: d.boxphone || "",
                  status: d.status, notes: d.notes || "" })}>Editar celular</button>
                <button className="btn-ghost text-xs"
                  onClick={() => setProxForm({ ...emptyProxy, device_id: d.id })}>+ Agregar proxy</button>
              </div>
            )}
          </div>
          );
        })}
        {filteredDevices.length === 0 && (
          <p className="text-hive-muted col-span-full py-10 text-center">
            {devices.length === 0
              ? <>No hay celulares. {can.edit && "Crea un proxy y luego un celular que lo use."}</>
              : "Ningún celular o proxy coincide con la búsqueda."}
          </p>
        )}
      </div>

      {/* Proxys sin asignar */}
      {proxies.some((p) => !usedProxyIds.has(p.id)) && (
        <div className="mt-6">
          <h2 className="text-sm font-semibold text-hive-muted mb-2">Proxys sin celular asignado</h2>
          <div className="flex flex-wrap gap-2">
            {proxies.filter((p) => !usedProxyIds.has(p.id)).map((p) => (
              <button key={p.id} onClick={() => can.edit && editProxy(p.id, null)}
                className="card px-3 py-2 text-xs flex items-center gap-2">
                {p.country_code && <span>{countryFlag(p.country_code)} {countryName(p.country_code)} ·</span>}
                <span className="font-mono">{p.ip}:{p.port}</span> <StatusBadge status={p.status} />
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
          <label className="label mt-3">País</label>
          <select className="input mb-3" value={proxForm.country_code || ""}
            onChange={(e) => setProxForm({ ...proxForm, country_code: e.target.value })}>
            <option value="">— sin especificar —</option>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>{countryFlag(c.code)} {c.name}</option>
            ))}
          </select>
          <label className="label">Celular asignado</label>
          <select className="input mb-3" value={proxForm.device_id} onChange={(e) => setProxForm({ ...proxForm, device_id: e.target.value })}>
            <option value="">— sin asignar —</option>
            {devices.map((d) => <option key={d.id} value={d.id}>{d.name}{d.nickname ? ` (${d.nickname})` : ""}</option>)}
          </select>
          <label className="label">Estado</label>
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
