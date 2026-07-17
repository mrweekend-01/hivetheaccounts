import { useEffect, useState } from "react";
import api from "../api/client";
import TaskPersonaRows from "../components/TaskPersonaRows";

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

function truncateLink(link, max = 60) {
  if (!link) return "(sin link)";
  return link.length > max ? link.slice(0, max) + "…" : link;
}

function progress(item) {
  if (item.total_count === 0) return { pct: null, label: "—", cls: "" };
  const pct = Math.round((item.completed_count / item.total_count) * 100);
  const cls = pct === 0 ? "stop" : pct === 100 ? "go" : "work";
  return { pct, label: `${item.completed_count}/${item.total_count} · ${pct}%`, cls };
}

export default function Tasks() {
  const [view, setView] = useState("list");   // "list" | "detail"
  const [list, setList] = useState([]);
  const [detail, setDetail] = useState(null);
  const [linkDraft, setLinkDraft] = useState("");
  const [creating, setCreating] = useState(false);

  function loadList() {
    return api.get("/tasks").then((r) => setList(r.data));
  }

  useEffect(() => { loadList(); }, []);

  async function openDetail(id) {
    const r = await api.get(`/tasks/${id}`);
    setDetail(r.data);
    setLinkDraft(r.data.link || "");
    setView("detail");
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const r = await api.post("/tasks", {});
      setDetail(r.data);
      setLinkDraft(r.data.link || "");
      setView("detail");
    } finally {
      setCreating(false);
    }
  }

  function backToList() {
    setView("list");
    setDetail(null);
    loadList();
  }

  async function persistLinkIfNeeded() {
    if (!detail) return;
    if (linkDraft !== (detail.link || "")) {
      const r = await api.put(`/tasks/${detail.id}`, { link: linkDraft });
      setDetail(r.data);
    }
  }

  async function handleToggle(socialAccountId, field, currentValue) {
    const r = await api.patch(`/tasks/${detail.id}/actions/${socialAccountId}`,
      { field, value: !currentValue });
    setDetail(r.data);
  }

  async function handleToggleAll(accountId) {
    const r = await api.post(`/tasks/${detail.id}/persons/${accountId}/toggle-all`);
    setDetail(r.data);
  }

  async function handleResetChecklist() {
    if (!confirm("¿Reiniciar el checklist de esta tarea? Se borrará todo el progreso marcado."))
      return;
    const r = await api.post(`/tasks/${detail.id}/reset`);
    setDetail(r.data);
  }

  return (
    <div>
      <h1 className="page-title mb-4">Tasks</h1>

      {view === "list" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-hive-text">Los Task</h2>
            <button className="btn-primary" onClick={handleCreate} disabled={creating}>
              {creating ? "Creando…" : "+ Nueva Task"}
            </button>
          </div>

          <div className="card divide-y divide-hive-border">
            {list.map((t) => {
              const { pct, label, cls } = progress(t);
              return (
                <button key={t.id} onClick={() => openDetail(t.id)}
                  className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-hive-panel2/60">
                  <span className="font-mono text-sm text-hive-text truncate flex-1 min-w-0"
                    title={t.link}>
                    {truncateLink(t.link)}
                  </span>
                  <span className="text-xs text-hive-muted shrink-0 w-32">
                    {fmtDate(t.updated_at)}
                  </span>
                  <div className="flex items-center gap-2 shrink-0 w-48 justify-end">
                    <div className="progress-track">
                      {pct !== null && (
                        <div className={`progress-fill ${cls}`} style={{ width: `${pct}%` }} />
                      )}
                    </div>
                    <span className="text-xs font-mono text-hive-muted w-28 text-right">
                      {label}
                    </span>
                  </div>
                </button>
              );
            })}
            {list.length === 0 && (
              <p className="text-hive-muted py-10 text-center">
                No hay tareas todavía. Creá la primera con "+ Nueva Task".
              </p>
            )}
          </div>
        </div>
      )}

      {view === "detail" && detail && (
        <div>
          <button className="btn-ghost mb-3" onClick={backToList}>
            ‹ Volver a Los Task
          </button>

          <div className="flex items-end gap-3 mb-4">
            <div className="flex-1">
              <label className="label mb-1">Link de la publicación</label>
              <input className="input text-base" value={linkDraft}
                onChange={(e) => setLinkDraft(e.target.value)}
                onBlur={persistLinkIfNeeded}
                placeholder="https://facebook.com/…" />
            </div>
            <button className="btn-ghost" onClick={handleResetChecklist}>
              Reiniciar checklist
            </button>
          </div>

          <TaskPersonaRows rows={detail.rows} onToggle={handleToggle} onToggleAll={handleToggleAll} />
        </div>
      )}
    </div>
  );
}
