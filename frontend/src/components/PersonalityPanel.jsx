import { useEffect, useState } from "react";
import api from "../api/client";
import TraitsInput from "./TraitsInput";

// Panel de "Personalidad" de una cuenta: características, descripción del
// perfil, horarios de conexión y perfiles que sigue. Todo se guarda con un
// PUT parcial a /accounts/{id}.
export default function PersonalityPanel({ accountId, onClose, onSaved }) {
  const [data, setData] = useState(null);
  const [traits, setTraits] = useState([]);
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [followed, setFollowed] = useState([]);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/accounts/${accountId}`).then((r) => {
      const d = r.data;
      setData(d);
      setTraits(d.traits || []);
      setDescription(d.description || "");
      setSchedule(d.connection_schedule || []);
      setFollowed(d.followed_profiles || []);
    });
  }, [accountId]);

  function addSlot() {
    setSchedule((prev) => [...prev, { start: "", end: "" }]);
  }
  function updateSlot(i, field, value) {
    setSchedule((prev) => prev.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));
  }
  function removeSlot(i) {
    setSchedule((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addFollowed() {
    setFollowed((prev) => [...prev, { name: "", link: "" }]);
  }
  function updateFollowed(i, field, value) {
    setFollowed((prev) => prev.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));
  }
  function removeFollowed(i) {
    setFollowed((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit() {
    setErr("");
    setBusy(true);
    try {
      await api.put(`/accounts/${accountId}`, {
        traits,
        description: description || null,
        connection_schedule: schedule,
        followed_profiles: followed,
      });
      onSaved();
    } catch (e) {
      setErr(e.response?.data?.detail || "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  if (!data)
    return (
      <div className="fixed inset-0 bg-black/70 grid place-items-center z-50" onClick={onClose}>
        <div className="text-hive-muted">Cargando…</div>
      </div>
    );

  return (
    <div className="fixed inset-0 bg-black/70 grid place-items-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-1">Personalidad</h3>
        <p className="text-hive-muted text-sm font-mono mb-4">{data.profile_name}</p>

        <label className="label">Características</label>
        <div className="mb-3">
          <TraitsInput value={traits} onChange={setTraits} />
        </div>

        <label className="label">Descripción del perfil</label>
        <textarea className="input mb-4" rows={4}
          placeholder="Notas de estilo, tono, contexto del personaje…"
          value={description} onChange={(e) => setDescription(e.target.value)} />

        <div className="label">Horarios de conexión</div>
        <div className="space-y-2 mb-2">
          {schedule.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <input type="time" className="input" value={s.start}
                onChange={(e) => updateSlot(i, "start", e.target.value)} />
              <span className="text-hive-muted text-sm">a</span>
              <input type="time" className="input" value={s.end}
                onChange={(e) => updateSlot(i, "end", e.target.value)} />
              <button type="button" className="text-hive-muted hover:text-bad text-lg leading-none shrink-0"
                onClick={() => removeSlot(i)} aria-label="Quitar horario">×</button>
            </div>
          ))}
          {schedule.length === 0 && <p className="text-hive-muted text-sm">Sin horarios definidos.</p>}
        </div>
        <button type="button" className="btn-ghost text-xs mb-4" onClick={addSlot}>+ Agregar horario</button>

        <div className="label">Perfiles que sigue</div>
        <div className="space-y-2 mb-2">
          {followed.map((f, i) => (
            <div key={i} className="flex items-center gap-2">
              <input className="input" placeholder="Nombre" value={f.name}
                onChange={(e) => updateFollowed(i, "name", e.target.value)} />
              <input className="input" placeholder="Link" value={f.link}
                onChange={(e) => updateFollowed(i, "link", e.target.value)} />
              <button type="button" className="text-hive-muted hover:text-bad text-lg leading-none shrink-0"
                onClick={() => removeFollowed(i)} aria-label="Quitar perfil">×</button>
            </div>
          ))}
          {followed.length === 0 && <p className="text-hive-muted text-sm">Sin perfiles seguidos.</p>}
        </div>
        <button type="button" className="btn-ghost text-xs mb-4" onClick={addFollowed}>+ Agregar perfil</button>

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
