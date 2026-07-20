import { useEffect, useState, useRef } from "react";
import api from "../api/client";
import HumanizationSocialIcon from "../components/HumanizationSocialIcon";
import TraitsInput from "../components/TraitsInput";
import HumanizationSchedules from "../components/HumanizationSchedules";
import { useAuth } from "../context/AuthContext";

const MIN_HUMANIZATION_MINUTES = 30;

const PLATFORM_LABEL = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok" };
const PLATFORM_SHORT = { facebook: "FB", instagram: "IG", tiktok: "TT" };

function fmtLastHumanized(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mi}`;
}

export default function Humanization() {
  const { can } = useAuth();
  const [tab, setTab] = useState("vista"); // "vista" | "programacion"
  const [view, setView] = useState(null);
  const [, setTick] = useState(0);              // fuerza re-render cada seg
  const [editingPersona, setEditingPersona] = useState(null); // persona siendo editada (traits)
  const [editTraits, setEditTraits] = useState([]);
  const [savingTraits, setSavingTraits] = useState(false);
  const [minutesInput, setMinutesInput] = useState(MIN_HUMANIZATION_MINUTES);
  const [savingMinutes, setSavingMinutes] = useState(false);
  const [minutesError, setMinutesError] = useState("");
  const localState = useRef({});                // {social_account_id: {remaining, status, notified}}

  function load() {
    api.get("/humanization").then((r) => {
      setView(r.data);
      const map = {};
      r.data.groups.forEach((g) => g.personas.forEach((p) => p.socials.forEach((s) => {
        if (s.social_account_id != null) {
          map[s.social_account_id] = {
            remaining: s.remaining_seconds, status: s.state, notified: false,
          };
        }
      })));
      localState.current = map;
    });
  }

  useEffect(() => {
    load();
    api.get("/settings/humanization").then((r) => setMinutesInput(r.data.humanization_minutes));
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // reloj: descuenta 1s a cada timer en_proceso y notifica al llegar a 0
  useEffect(() => {
    const iv = setInterval(() => {
      const map = localState.current;
      let anyDone = false;
      Object.entries(map).forEach(([id, o]) => {
        if (o.status === "en_proceso" && o.remaining > 0) {
          o.remaining -= 1;
          if (o.remaining === 0 && !o.notified) {
            o.notified = true; anyDone = true;
            notify(id);
            api.post(`/humanization/${id}/done`).then(load);
          }
        }
      });
      setTick((t) => t + 1);
      if (anyDone) load();
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  function findSocial(id) {
    for (const g of view?.groups || [])
      for (const p of g.personas)
        for (const s of p.socials)
          if (String(s.social_account_id) === String(id)) return { persona: p, social: s };
    return null;
  }

  function notify(id) {
    const found = findSocial(id);
    const label = found
      ? `${found.persona.profile_name || found.persona.corporate_email} · ${PLATFORM_LABEL[found.social.platform]}`
      : `cuenta ${id}`;
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Humanización completada", { body: `${label} ya se humanizó ✓` });
    }
  }

  async function start(id) {
    await api.post(`/humanization/${id}/start`);
    load();
  }
  async function pause(id) {
    await api.post(`/humanization/${id}/pause`);
    load();
  }
  async function resume(id) {
    await api.post(`/humanization/${id}/resume`);
    load();
  }
  async function reset(deviceId) {
    if (!confirm("¿Reiniciar humanización? Todos los estados vuelven a pendiente.")) return;
    await api.post("/humanization/reset", null, { params: deviceId ? { device_id: deviceId } : {} });
    load();
  }

  async function saveMinutes() {
    setMinutesError(""); setSavingMinutes(true);
    try {
      await api.put("/settings/humanization", { humanization_minutes: Number(minutesInput) });
      load();
    } catch (e) {
      setMinutesError(e.response?.data?.detail || "Error al guardar");
    } finally {
      setSavingMinutes(false);
    }
  }

  function openTraitsEditor(persona) {
    setEditingPersona(persona);
    setEditTraits(persona.traits || []);
  }

  async function saveTraits() {
    setSavingTraits(true);
    try {
      await api.put(`/accounts/${editingPersona.account_id}`, { traits: editTraits });
      setEditingPersona(null);
      load();
    } finally {
      setSavingTraits(false);
    }
  }

  if (!view) return <p className="text-hive-muted">Cargando…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Humanización</h1>
          <p className="text-hive-muted text-sm">
            Temporizador de {view.humanization_minutes} min por red social · agrupado por celular
          </p>
        </div>
        <div className="flex items-center gap-3">
          {can.admin && (
            <div className="flex items-center gap-2">
              <label className="label mb-0">Minutos por humanización</label>
              <input type="number" min={MIN_HUMANIZATION_MINUTES} value={minutesInput}
                onChange={(e) => setMinutesInput(e.target.value)}
                className="input w-20" />
              <button className="btn-ghost" onClick={saveMinutes}
                disabled={savingMinutes || Number(minutesInput) < MIN_HUMANIZATION_MINUTES}>
                {savingMinutes ? "Guardando…" : "Guardar"}
              </button>
              {minutesError && <span className="text-bad text-xs">{minutesError}</span>}
            </div>
          )}
          <button className="btn-primary" disabled={!view.all_done} onClick={() => reset(null)}
            title={view.all_done ? "" : "Se habilita cuando todas están hechas"}>
            Reiniciar humanización
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <button className={tab === "vista" ? "btn-primary" : "btn-ghost"} onClick={() => setTab("vista")}>
          Vista
        </button>
        <button className={tab === "programacion" ? "btn-primary" : "btn-ghost"} onClick={() => setTab("programacion")}>
          Programación
        </button>
      </div>

      {tab === "programacion" ? (
        <HumanizationSchedules view={view} />
      ) : (
      <div className="space-y-4">
        {view.groups.map((g) => (
          <div key={g.device_id ?? "none"} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{g.device_name}
                <span className="text-hive-muted text-sm ml-2">({g.personas.length})</span></h2>
              <button className="btn-ghost text-xs" onClick={() => reset(g.device_id)}>Reiniciar grupo</button>
            </div>
            <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
              {g.personas.map((p) => (
                <div key={p.account_id} className="rounded-md border border-hive-border bg-hive-bg p-3">
                  {/* identidad + redes: fila única, las 3 en horizontal (no apiladas) */}
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{p.profile_name || "—"}</div>
                      <div className="font-mono text-xs text-hive-muted truncate">{p.corporate_email}</div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {p.socials.map((s) => {
                        const local = s.social_account_id != null ? localState.current[s.social_account_id] : null;
                        const state = local?.status ?? s.state;
                        const remaining = local?.remaining ?? s.remaining_seconds;
                        return (
                          <HumanizationSocialIcon key={s.platform} platform={s.platform} state={state}
                            remainingSeconds={remaining}
                            onStart={s.social_account_id != null ? () => start(s.social_account_id) : undefined}
                            onPause={s.social_account_id != null ? () => pause(s.social_account_id) : undefined}
                            onResume={s.social_account_id != null ? () => resume(s.social_account_id) : undefined} />
                        );
                      })}
                    </div>
                  </div>

                  {/* características + última humanización: usan ahora el ancho completo de la tarjeta */}
                  <div className="mt-3 pt-3 border-t border-hive-border flex flex-col sm:flex-row sm:items-start gap-3">
                    <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                      <div className="flex flex-wrap gap-2">
                        {p.traits.length > 0 ? p.traits.map((t) => (
                          <span key={t} className="tape text-sm px-3 py-1.5">{t}</span>
                        )) : <span className="text-hive-muted text-sm">Sin características</span>}
                      </div>
                      <button className="text-hive-muted hover:text-hive-text text-sm leading-none shrink-0"
                        title="Editar características" onClick={() => openTraitsEditor(p)}>✎</button>
                    </div>
                    <div className="text-xs text-hive-muted sm:w-44 shrink-0 sm:border-l sm:border-hive-border sm:pl-3">
                      <div className="font-semibold uppercase tracking-wide mb-1">Última humanización</div>
                      {p.socials.map((s) => (
                        <div key={s.platform} className="flex justify-between gap-3">
                          <span>{PLATFORM_SHORT[s.platform]}:</span>
                          <span className="font-mono">{fmtLastHumanized(s.last_humanized_at)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {view.groups.length === 0 && (
          <p className="text-hive-muted py-10 text-center">No hay cuentas todavía.</p>
        )}
      </div>
      )}

      {editingPersona && (
        <div className="fixed inset-0 bg-black/70 grid place-items-center z-50 p-4" onClick={() => setEditingPersona(null)}>
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-1">Características</h3>
            <p className="text-hive-muted text-sm font-mono mb-4">
              {editingPersona.profile_name || editingPersona.corporate_email}
            </p>
            <TraitsInput value={editTraits} onChange={setEditTraits} />
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn-ghost" onClick={() => setEditingPersona(null)}>Cancelar</button>
              <button className="btn-primary" onClick={saveTraits} disabled={savingTraits}>
                {savingTraits ? "Guardando…" : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
