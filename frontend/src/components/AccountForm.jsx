import { useState, useEffect } from "react";
import api from "../api/client";
import TraitsInput from "./TraitsInput";

const PLATFORMS = ["facebook", "instagram", "tiktok"];
const STATUSES = ["activo", "inactivo", "suspendido", "en_revision"];

// Crear/editar cuenta. Si `account` viene, es edición.
export default function AccountForm({ account, devices, onClose, onSaved }) {
  const editing = !!account;
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [status, setStatus] = useState("activo");
  const [deviceId, setDeviceId] = useState("");
  const [notes, setNotes] = useState("");
  const [profileName, setProfileName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [seqNumber, setSeqNumber] = useState("");
  const [traits, setTraits] = useState([]);
  const [socials, setSocials] = useState({}); // {platform: {username, password, slot_number, profile_url, two_fa_secret}}
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!account) return;
    api.get(`/accounts/${account.id}?reveal=true`).then((r) => {
      const d = r.data;
      setEmail(d.corporate_email);
      setPass(d.corp_password || "");
      setStatus(d.status);
      setDeviceId(d.device_id || "");
      setNotes(d.notes || "");
      setProfileName(d.profile_name || "");
      setBirthDate(d.birth_date || "");
      setSeqNumber(d.sequence_number ?? "");
      setTraits(d.traits || []);
      const s = {};
      d.socials.forEach((sa) => {
        s[sa.platform] = {
          username: sa.username || "", password: sa.password || "",
          slot_number: sa.slot_number ?? "", profile_url: sa.profile_url || "",
        };
      });
      setSocials(s);
    });
  }, [account]);

  function toggleSocial(p) {
    setSocials((prev) => {
      const next = { ...prev };
      if (next[p]) delete next[p];
      else next[p] = { username: "", password: "", slot_number: "", profile_url: "" };
      return next;
    });
  }

  async function submit() {
    setErr(""); setBusy(true);
    const socialsPayload = Object.entries(socials).map(([platform, v]) => ({
      platform,
      username: v.username || null,
      password: v.password || null,
      slot_number: v.slot_number ? Number(v.slot_number) : null,
      profile_url: v.profile_url || null,
    }));
    const body = {
      corporate_email: email, status, notes,
      device_id: deviceId ? Number(deviceId) : null,
      profile_name: profileName || null,
      birth_date: birthDate || null,
      sequence_number: seqNumber !== "" ? Number(seqNumber) : null,
      traits,
      socials: socialsPayload,
    };
    if (!editing) body.corp_password = pass;
    else if (pass) body.corp_password = pass;
    try {
      if (editing) await api.put(`/accounts/${account.id}`, body);
      else await api.post("/accounts", body);
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.detail || "Error al guardar");
    } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 bg-black/70 grid place-items-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4">{editing ? "Editar cuenta" : "Nueva cuenta"}</h3>

        <label className="label">Correo de respaldo</label>
        <input className="input mb-3" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label className="label">Contraseña del correo {editing && "(vacío = no cambiar)"}</label>
        <input className="input mb-3" value={pass} onChange={(e) => setPass(e.target.value)} />

        <div className="text-xs font-semibold text-hive-accent uppercase mt-2 mb-2">Identidad del perfil</div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="col-span-2">
            <label className="label">Nombre del perfil</label>
            <input className="input" value={profileName} onChange={(e) => setProfileName(e.target.value)} />
          </div>
          <div>
            <label className="label">Fecha de nacimiento</label>
            <input className="input" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
          </div>
          <div>
            <label className="label">Número de orden</label>
            <input className="input" type="number" value={seqNumber} onChange={(e) => setSeqNumber(e.target.value)} />
          </div>
        </div>

        <label className="label">Características</label>
        <div className="mb-3">
          <TraitsInput value={traits} onChange={setTraits} />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="label">Estado</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Celular</label>
            <select className="input" value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
              <option value="">— sin asignar —</option>
              {devices.map((d) => <option key={d.id} value={d.id}>{d.name}{d.nickname ? ` (${d.nickname})` : ""}</option>)}
            </select>
          </div>
        </div>

        <div className="label">Redes sociales</div>
        <p className="text-xs text-hive-muted mb-2">
          Marca la red aunque no tengas todavía usuario/contraseña — queda en ámbar como "pendiente".
        </p>
        <div className="space-y-2 mb-3">
          {PLATFORMS.map((p) => (
            <div key={p} className="border border-hive-border rounded-md p-2">
              <label className="flex items-center gap-2 text-sm capitalize mb-1">
                <input type="checkbox" checked={!!socials[p]} onChange={() => toggleSocial(p)} />
                {p}
              </label>
              {socials[p] && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input" placeholder="usuario (opcional)" value={socials[p].username}
                      onChange={(e) => setSocials((s) => ({ ...s, [p]: { ...s[p], username: e.target.value } }))} />
                    <input className="input" placeholder="contraseña (opcional)" value={socials[p].password}
                      onChange={(e) => setSocials((s) => ({ ...s, [p]: { ...s[p], password: e.target.value } }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input className="input" placeholder="slot # (opcional)" type="number" value={socials[p].slot_number}
                      onChange={(e) => setSocials((s) => ({ ...s, [p]: { ...s[p], slot_number: e.target.value } }))} />
                    <input className="input" placeholder="link del perfil (opcional)" value={socials[p].profile_url}
                      onChange={(e) => setSocials((s) => ({ ...s, [p]: { ...s[p], profile_url: e.target.value } }))} />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <label className="label">Notas internas</label>
        <textarea className="input mb-4" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />

        {err && <p className="text-bad text-sm mb-3">{err}</p>}
        <div className="flex justify-end gap-2">
          <button className="btn-ghost" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={submit} disabled={busy}>
            {busy ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
