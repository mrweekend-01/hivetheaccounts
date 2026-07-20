import { useEffect, useState } from "react";
import api from "../api/client";

const PLATFORM_LABEL = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok" };
const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Sub-sección "Programación": horarios recurrentes que el scheduler del
// backend usa para disparar el inicio automático de una humanización.
// `view` es la misma vista ya cargada por Humanization.jsx (groups/personas/
// socials), se reutiliza para armar el dropdown de cuenta+red sin pegarle a
// un endpoint nuevo.
export default function HumanizationSchedules({ view }) {
  const [schedules, setSchedules] = useState([]);
  const [socialAccountId, setSocialAccountId] = useState("");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [allDays, setAllDays] = useState(true);
  const [days, setDays] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  function load() {
    api.get("/humanization-schedules").then((r) => setSchedules(r.data));
  }
  useEffect(load, []);

  const options = [];
  (view?.groups || []).forEach((g) => g.personas.forEach((p) => p.socials.forEach((s) => {
    if (s.social_account_id != null) {
      options.push({
        id: s.social_account_id,
        label: `${p.profile_name || p.corporate_email || "—"} · ${PLATFORM_LABEL[s.platform]}`,
      });
    }
  })));

  function toggleDay(d) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  }

  async function submit() {
    setErr("");
    if (!socialAccountId || !timeOfDay) {
      setErr("Selecciona cuenta+red y una hora.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/humanization-schedules", {
        social_account_id: Number(socialAccountId),
        time_of_day: timeOfDay,
        days_of_week: allDays ? null : days,
        active: true,
      });
      setSocialAccountId(""); setTimeOfDay(""); setAllDays(true); setDays([]);
      load();
    } catch (e) {
      setErr(e.response?.data?.detail || "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive(s) {
    await api.put(`/humanization-schedules/${s.id}`, { active: !s.active });
    load();
  }

  async function remove(id) {
    if (!confirm("¿Eliminar este horario programado?")) return;
    await api.delete(`/humanization-schedules/${id}`);
    load();
  }

  return (
    <div>
      <div className="card p-4 mb-4">
        <h2 className="font-semibold mb-3">Nuevo horario</h2>
        <label className="label">Cuenta y red</label>
        <select className="input mb-3" value={socialAccountId} onChange={(e) => setSocialAccountId(e.target.value)}>
          <option value="">— selecciona —</option>
          {options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
        </select>

        <label className="label">Hora</label>
        <input type="time" className="input mb-3" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} />

        <label className="flex items-center gap-2 text-sm mb-2">
          <input type="checkbox" checked={allDays} onChange={(e) => setAllDays(e.target.checked)} />
          Todos los días
        </label>
        {!allDays && (
          <div className="flex flex-wrap gap-2 mb-3">
            {DAY_LABELS.map((label, i) => (
              <label key={i} className="chip bg-hive-panel2 text-xs flex items-center gap-1">
                <input type="checkbox" checked={days.includes(i)} onChange={() => toggleDay(i)} />
                {label}
              </label>
            ))}
          </div>
        )}

        {err && <p className="text-bad text-sm mb-3">{err}</p>}
        <button className="btn-primary" onClick={submit} disabled={busy}>
          {busy ? "Guardando…" : "Guardar horario"}
        </button>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-hive-panel2 text-hive-muted text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2.5 font-medium">Persona</th>
              <th className="text-left px-4 py-2.5 font-medium">Red</th>
              <th className="text-left px-4 py-2.5 font-medium">Hora</th>
              <th className="text-left px-4 py-2.5 font-medium">Días</th>
              <th className="text-left px-4 py-2.5 font-medium">Activo</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id} className="border-t border-hive-border">
                <td className="px-4 py-3">{s.profile_name || "—"}</td>
                <td className="px-4 py-3">{PLATFORM_LABEL[s.platform]}</td>
                <td className="px-4 py-3 font-mono">{s.time_of_day}</td>
                <td className="px-4 py-3 text-xs text-hive-muted">
                  {s.days_of_week ? s.days_of_week.map((d) => DAY_LABELS[d]).join(", ") : "todos los días"}
                </td>
                <td className="px-4 py-3">
                  <input type="checkbox" checked={s.active} onChange={() => toggleActive(s)} />
                </td>
                <td className="px-4 py-3 text-right">
                  <button className="text-hive-muted hover:text-bad text-xs" onClick={() => remove(s.id)}>Eliminar</button>
                </td>
              </tr>
            ))}
            {schedules.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-hive-muted">No hay horarios programados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
