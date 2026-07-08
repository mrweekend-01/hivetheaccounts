import { useEffect, useState, useRef } from "react";
import api from "../api/client";

const PLATFORM_LABEL = { facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok" };

function fmt(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function Humanization() {
  const [view, setView] = useState(null);
  const [, setTick] = useState(0);              // fuerza re-render cada seg
  const localState = useRef({});                // {social_account_id: {remaining, status, notified}}

  function load() {
    api.get("/humanization").then((r) => {
      setView(r.data);
      const map = {};
      r.data.groups.forEach((g) => g.items.forEach((it) => {
        map[it.social_account_id] = {
          remaining: it.remaining_seconds, status: it.humanization_status, notified: false,
        };
      }));
      localState.current = map;
    });
  }

  useEffect(() => {
    load();
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

  function notify(id) {
    const item = findItem(id);
    const label = item ? `${item.profile_name || item.corporate_email} · ${PLATFORM_LABEL[item.platform]}` : `cuenta ${id}`;
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Humanización completada", { body: `${label} ya se humanizó ✓` });
    }
  }
  function findItem(id) {
    for (const g of view?.groups || [])
      for (const it of g.items) if (String(it.social_account_id) === String(id)) return it;
    return null;
  }

  async function start(id) {
    await api.post(`/humanization/${id}/start`);
    load();
  }
  async function reset(deviceId) {
    if (!confirm("¿Reiniciar humanización? Todos los estados vuelven a pendiente.")) return;
    await api.post("/humanization/reset", null, { params: deviceId ? { device_id: deviceId } : {} });
    load();
  }

  if (!view) return <p className="text-hive-muted">Cargando…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">Humanización</h1>
          <p className="text-hive-muted text-sm">
            Temporizador de {view.humanization_minutes} min por red social · agrupado por celular
          </p>
        </div>
        <button className="btn-primary" disabled={!view.all_done} onClick={() => reset(null)}
          title={view.all_done ? "" : "Se habilita cuando todas están hechas"}>
          Reiniciar humanización
        </button>
      </div>

      <div className="space-y-4">
        {view.groups.map((g) => (
          <div key={g.device_id ?? "none"} className="card p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">{g.device_name}
                <span className="text-hive-muted text-sm ml-2">({g.items.length})</span></h2>
              <button className="btn-ghost text-xs" onClick={() => reset(g.device_id)}>Reiniciar grupo</button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((it) => {
                const local = localState.current[it.social_account_id] || {};
                const remaining = local.remaining ?? it.remaining_seconds;
                const status = local.status ?? it.humanization_status;
                const done = status === "hecho";
                const running = status === "en_proceso";
                return (
                  <div key={it.social_account_id}
                    className={`rounded-md border p-3 ${
                      done ? "border-ok/40 bg-ok/10"
                           : running ? "border-warn/40 bg-warn/10" : "border-hive-border bg-hive-bg"}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="chip bg-hive-panel2 text-hive-amber text-[10px]">{PLATFORM_LABEL[it.platform]}</span>
                    </div>
                    <div className="text-sm font-medium truncate">{it.profile_name || "—"}</div>
                    <div className="font-mono text-xs text-hive-muted truncate mb-2">{it.corporate_email}</div>
                    {done ? (
                      <div className="text-ok text-sm font-semibold">✓ Hecho</div>
                    ) : running ? (
                      <div className="text-warn font-mono text-lg tabular-nums">{fmt(remaining)}</div>
                    ) : (
                      <button className="btn-primary text-xs w-full justify-center" onClick={() => start(it.social_account_id)}>
                        Iniciar 30 min
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {view.groups.length === 0 && (
          <p className="text-hive-muted py-10 text-center">No hay redes sociales con credenciales para humanizar.</p>
        )}
      </div>
    </div>
  );
}
