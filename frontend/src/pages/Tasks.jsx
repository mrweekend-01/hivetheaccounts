import { useEffect, useState } from "react";
import api from "../api/client";
import TaskPersonaRows from "../components/TaskPersonaRows";
import { useAuth } from "../context/AuthContext";

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

function isTaskComplete(item) {
  return item.total_count > 0 && item.completed_count === item.total_count;
}

function completionFromRows(rows) {
  let total = 0, done = 0;
  for (const row of rows) {
    for (const p of row.platforms) {
      if (!p.active) continue;
      total += 4;
      done += (p.liked ? 1 : 0) + (p.shared ? 1 : 0) + (p.commented ? 1 : 0) + (p.followed ? 1 : 0);
    }
  }
  return { done, total };
}

export default function Tasks() {
  const { can } = useAuth();
  const [view, setView] = useState("list");   // "list" | "detail"
  const [list, setList] = useState([]);
  const [detail, setDetail] = useState(null);
  const [linkDraft, setLinkDraft] = useState("");
  const [creating, setCreating] = useState(false);
  const [f, setF] = useState({ search: "", platform: "", status: "", device_id: "", boxphone: "" });
  const [listSearch, setListSearch] = useState("");
  const [commentOpenId, setCommentOpenId] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");

  function loadList() {
    return api.get("/tasks").then((r) => setList(r.data));
  }

  useEffect(() => { loadList(); }, []);

  async function openDetail(id) {
    const r = await api.get(`/tasks/${id}`);
    setDetail(r.data);
    setLinkDraft(r.data.link || "");
    setF({ search: "", platform: "", status: "", device_id: "", boxphone: "" });
    setView("detail");
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const r = await api.post("/tasks", {});
      setDetail(r.data);
      setLinkDraft(r.data.link || "");
      setF({ search: "", platform: "", status: "", device_id: "", boxphone: "" });
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

  async function handleDelete(e, id) {
    e.stopPropagation();
    if (!confirm("¿Eliminar esta tarea? Se perderá todo su progreso y no se puede deshacer."))
      return;
    await api.delete(`/tasks/${id}`);
    setList((prev) => prev.filter((t) => t.id !== id));
  }

  async function handleResetChecklist() {
    if (!confirm("¿Reiniciar el checklist de esta tarea? Se borrará todo el progreso marcado."))
      return;
    const r = await api.post(`/tasks/${detail.id}/reset`);
    setDetail(r.data);
  }

  function toggleCommentBox(e, t) {
    e.stopPropagation();
    if (commentOpenId === t.id) {
      setCommentOpenId(null);
      return;
    }
    setCommentDraft(t.comment || "");
    setCommentOpenId(t.id);
  }

  async function saveComment(id) {
    await api.put(`/tasks/${id}`, { comment: commentDraft });
    setList((prev) => prev.map((t) => (t.id === id ? { ...t, comment: commentDraft } : t)));
    setCommentOpenId(null);
  }

  function handleCommentKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.target.blur();
    }
  }

  async function handleComplete(e, t) {
    e.stopPropagation();
    const complete = isTaskComplete(t);
    const msg = complete
      ? "¿Desmarcar toda esta tarea? Se quitarán todas las acciones completadas."
      : "¿Marcar toda esta tarea como completada al 100%?";
    if (!confirm(msg)) return;
    const r = await api.post(`/tasks/${t.id}/complete`, { value: !complete });
    const { done, total } = completionFromRows(r.data.rows);
    setList((prev) => prev.map((item) =>
      item.id === t.id
        ? { ...item, completed_count: done, total_count: total, updated_at: r.data.updated_at }
        : item));
  }

  const deviceOptions = detail
    ? [...new Map(detail.rows.filter((r) => r.device_id != null).map((r) => [r.device_id, r.device_label])).entries()]
    : [];
  const boxphoneOptions = detail
    ? [...new Set(detail.rows.map((r) => r.boxphone).filter(Boolean))].sort()
    : [];

  const filteredRows = detail
    ? detail.rows.filter((r) => {
        if (f.search) {
          const q = f.search.toLowerCase();
          const matches = (r.profile_name || "").toLowerCase().includes(q) ||
            (r.corporate_email || "").toLowerCase().includes(q);
          if (!matches) return false;
        }
        if (f.platform && !r.platforms.some((p) => p.platform === f.platform && p.active)) return false;
        if (f.status && r.status !== f.status) return false;
        if (f.device_id && String(r.device_id) !== String(f.device_id)) return false;
        if (f.boxphone && r.boxphone !== f.boxphone) return false;
        return true;
      })
    : [];

  const filteredList = listSearch
    ? list.filter((t) => (t.link || "").toLowerCase().includes(listSearch.toLowerCase()))
    : list;

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

          <div className="card p-3 mb-4 flex flex-wrap gap-3">
            <input className="input flex-1 min-w-[180px]" placeholder="Buscar por link…"
              value={listSearch} onChange={(e) => setListSearch(e.target.value)} />
          </div>

          <div className="card divide-y divide-hive-border">
            {filteredList.map((t) => {
              const { pct, label, cls } = progress(t);
              const complete = isTaskComplete(t);
              const hasComment = !!(t.comment && t.comment.trim());
              return (
                <div key={t.id}>
                  <div onClick={() => openDetail(t.id)} role="button" tabIndex={0}
                    className="w-full flex items-center gap-4 px-4 py-3 text-left hover:bg-hive-panel2/60 cursor-pointer">
                    <span className="font-mono text-xs text-hive-muted shrink-0 w-10">
                      #{t.order_number}
                    </span>
                    <span className="font-mono text-sm text-hive-text truncate flex-1 min-w-0"
                      title={t.link}>
                      {truncateLink(t.link)}
                    </span>
                    <button type="button"
                      className={`btn-ghost text-xs px-2 py-1.5 shrink-0 ${hasComment ? "text-hive-accent" : "text-hive-muted"}`}
                      title={hasComment ? "Ver/editar comentario" : "Agregar comentario"}
                      onClick={(e) => toggleCommentBox(e, t)}>
                      {hasComment ? "📝" : "🗒️"}
                    </button>
                    <span className="text-xs text-hive-muted shrink-0 w-32">
                      {fmtDate(t.updated_at)}
                    </span>
                    <button type="button"
                      className={`btn-ghost text-xs px-2 py-1.5 shrink-0 ${complete ? "text-ok" : "text-hive-muted"}`}
                      title={complete ? "Desmarcar tarea completa" : "Marcar tarea completa"}
                      onClick={(e) => handleComplete(e, t)}>
                      {complete ? "✅" : "⬜"}
                    </button>
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
                    {can.admin && (
                      <button type="button" className="btn-ghost text-xs px-2 py-1.5 text-bad hover:bg-bad/10 shrink-0"
                        title="Eliminar tarea" onClick={(e) => handleDelete(e, t.id)}>
                        🗑
                      </button>
                    )}
                  </div>
                  {commentOpenId === t.id && (
                    <div className="px-4 pb-3 -mt-1" onClick={(e) => e.stopPropagation()}>
                      <textarea className="input w-full text-sm" rows={2} autoFocus
                        placeholder="Comentario para esta tarea…"
                        value={commentDraft}
                        onChange={(e) => setCommentDraft(e.target.value)}
                        onBlur={() => saveComment(t.id)}
                        onKeyDown={handleCommentKeyDown} />
                    </div>
                  )}
                </div>
              );
            })}
            {filteredList.length === 0 && (
              <p className="text-hive-muted py-10 text-center">
                {list.length === 0
                  ? 'No hay tareas todavía. Creá la primera con "+ Nueva Task".'
                  : "Ninguna tarea coincide con la búsqueda."}
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
              {deviceOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <select className="input w-auto" value={f.boxphone} onChange={(e) => setF({ ...f, boxphone: e.target.value })}>
              <option value="">Todos los boxphones</option>
              {boxphoneOptions.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <TaskPersonaRows rows={filteredRows} onToggle={handleToggle} onToggleAll={handleToggleAll} />
        </div>
      )}
    </div>
  );
}
