import { useEffect, useState } from "react";
import api from "../api/client";
import TaskPersonaRows from "../components/TaskPersonaRows";
import AccountModal from "../components/AccountModal";
import CatalogManagerModal from "../components/CatalogManagerModal";
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
  if (item.force_completed) {
    const real = item.total_count > 0 ? ` · ${item.completed_count}/${item.total_count} real` : "";
    return { pct: 100, label: `Cerrada${real}`, cls: "go" };
  }
  if (item.total_count === 0) return { pct: null, label: "—", cls: "" };
  const pct = item.display_percent;
  const cls = pct === 0 ? "stop" : pct === 100 ? "go" : "work";
  return { pct, label: `${item.completed_count}/${item.total_count} · ${pct}%`, cls };
}

function displayPercentFor(item) {
  if (item.force_completed) return 100;
  return item.total_count > 0 ? Math.round((item.completed_count / item.total_count) * 100) : 0;
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
  const [clientFilter, setClientFilter] = useState("");
  const [reportFilter, setReportFilter] = useState("");
  const [commentOpenId, setCommentOpenId] = useState(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [clients, setClients] = useState([]);
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [reports, setReports] = useState([]);
  const [creatingReport, setCreatingReport] = useState(false);
  const [newReportName, setNewReportName] = useState("");
  const [managingCatalogs, setManagingCatalogs] = useState(false);
  const [viewAccountId, setViewAccountId] = useState(null);

  function loadList() {
    return api.get("/tasks").then((r) => setList(r.data));
  }

  function loadClients() {
    return api.get("/clients").then((r) => setClients(r.data));
  }

  function loadReports() {
    return api.get("/reports").then((r) => setReports(r.data));
  }

  useEffect(() => { loadList(); loadClients(); loadReports(); }, []);

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
    const closed = t.force_completed;
    const msg = closed
      ? "¿Reabrir esta tarea? Volverá a mostrar su progreso real."
      : "¿Marcar esta tarea como completada? El progreso real de cada perfil no se modifica, solo se cierra la tarea.";
    if (!confirm(msg)) return;
    const r = await api.post(`/tasks/${t.id}/complete`, { value: !closed });
    setList((prev) => prev.map((item) =>
      item.id === t.id
        ? {
            ...item,
            force_completed: r.data.force_completed,
            display_percent: displayPercentFor({ ...item, force_completed: r.data.force_completed }),
            updated_at: r.data.updated_at,
          }
        : item));
  }

  async function persistClientId(clientId) {
    const r = await api.put(`/tasks/${detail.id}`, { client_id: clientId });
    setDetail(r.data);
  }

  function handleClientSelect(e) {
    const v = e.target.value;
    if (v === "__new__") {
      setNewClientName("");
      setCreatingClient(true);
      return;
    }
    persistClientId(v ? Number(v) : null);
  }

  async function handleCreateClient() {
    const name = newClientName.trim();
    if (!name) return;
    const r = await api.post("/clients", { name });
    setClients((prev) => [...prev, r.data].sort((a, b) => a.name.localeCompare(b.name)));
    setCreatingClient(false);
    await persistClientId(r.data.id);
  }

  async function persistReportId(reportId) {
    const r = await api.put(`/tasks/${detail.id}`, { report_id: reportId });
    setDetail(r.data);
  }

  function handleReportSelect(e) {
    const v = e.target.value;
    if (v === "__new__") {
      setNewReportName("");
      setCreatingReport(true);
      return;
    }
    persistReportId(v ? Number(v) : null);
  }

  async function handleCreateReport() {
    const name = newReportName.trim();
    if (!name) return;
    const r = await api.post("/reports", { name });
    setReports((prev) => [...prev, r.data].sort((a, b) => a.name.localeCompare(b.name)));
    setCreatingReport(false);
    await persistReportId(r.data.id);
  }

  async function refreshAfterCatalogChange() {
    await Promise.all([loadClients(), loadReports(), loadList()]);
    if (detail) {
      const r = await api.get(`/tasks/${detail.id}`);
      setDetail(r.data);
    }
  }

  async function handleRenameClient(client, name) {
    await api.put(`/clients/${client.id}`, { name });
    await refreshAfterCatalogChange();
  }

  async function handleDeleteClient(client) {
    if (!confirm("¿Eliminar este cliente? Las tareas que lo tenían quedarán sin asignar."))
      return;
    await api.delete(`/clients/${client.id}`);
    await refreshAfterCatalogChange();
  }

  async function handleRenameReport(report, name) {
    await api.put(`/reports/${report.id}`, { name });
    await refreshAfterCatalogChange();
  }

  async function handleDeleteReport(report) {
    if (!confirm("¿Eliminar este informe? Las tareas que lo tenían quedarán sin asignar."))
      return;
    await api.delete(`/reports/${report.id}`);
    await refreshAfterCatalogChange();
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

  const filteredList = list.filter((t) => {
    if (listSearch && !(t.link || "").toLowerCase().includes(listSearch.toLowerCase())) return false;
    if (clientFilter === "none" && t.client_id != null) return false;
    if (clientFilter && clientFilter !== "none" && String(t.client_id) !== clientFilter) return false;
    if (reportFilter === "none" && t.report_id != null) return false;
    if (reportFilter && reportFilter !== "none" && String(t.report_id) !== reportFilter) return false;
    return true;
  });

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
            <select className="input w-auto" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)}>
              <option value="">Todos los clientes</option>
              <option value="none">Sin cliente</option>
              {clients.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
            </select>
            <select className="input w-auto" value={reportFilter} onChange={(e) => setReportFilter(e.target.value)}>
              <option value="">Todos los informes</option>
              <option value="none">Sin informe</option>
              {reports.map((r) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
            </select>
            <button type="button" className="btn-ghost text-sm px-2" title="Gestionar catálogos"
              onClick={() => setManagingCatalogs(true)}>
              ⚙️
            </button>
          </div>

          <div className="card divide-y divide-hive-border">
            {filteredList.map((t) => {
              const { pct, label, cls } = progress(t);
              const complete = t.force_completed;
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
                    <span className={`chip shrink-0 ${t.client_name ? "bg-hive-panel2 text-hive-text" : "bg-hive-panel2 text-hive-muted"}`}>
                      {t.client_name || "Sin cliente"}
                    </span>
                    <span className={`chip shrink-0 ${t.report_name ? "bg-hive-panel2 text-hive-text" : "bg-hive-panel2 text-hive-muted"}`}>
                      {t.report_name || "Sin informe"}
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
                      title={complete ? "Reabrir tarea (mostrar progreso real)" : "Cerrar tarea al 100%"}
                      onClick={(e) => handleComplete(e, t)}>
                      {complete ? "✅" : "⬜"}
                    </button>
                    <div className="flex items-center gap-2 shrink-0 w-56 justify-end">
                      <div className="progress-track">
                        {pct !== null && (
                          <div className={`progress-fill ${cls}`} style={{ width: `${pct}%` }} />
                        )}
                      </div>
                      <span className="text-xs font-mono text-hive-muted w-36 text-right">
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

          <div className="flex items-end gap-3 mb-3">
            <div className="flex-1">
              <label className="label mb-1">Link de la publicación</label>
              <input className="input text-base" value={linkDraft}
                onChange={(e) => setLinkDraft(e.target.value)}
                onBlur={persistLinkIfNeeded}
                placeholder="https://facebook.com/…" />
            </div>
            <div className="w-56">
              <label className="label mb-1">Cliente</label>
              <select className="input" value={detail.client_id ?? ""} onChange={handleClientSelect}>
                <option value="">Sin cliente</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                <option value="__new__">+ Nuevo cliente</option>
              </select>
            </div>
            <div className="w-56">
              <label className="label mb-1">Número de informe</label>
              <select className="input" value={detail.report_id ?? ""} onChange={handleReportSelect}>
                <option value="">Sin informe</option>
                {reports.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                <option value="__new__">+ Nuevo informe</option>
              </select>
            </div>
            <button type="button" className="btn-ghost" title="Gestionar catálogos"
              onClick={() => setManagingCatalogs(true)}>
              ⚙️
            </button>
            <button className="btn-ghost" onClick={handleResetChecklist}>
              Reiniciar checklist
            </button>
          </div>

          {creatingClient && (
            <div className="flex items-center gap-2 mb-3">
              <input className="input flex-1 max-w-xs" autoFocus placeholder="Nombre del nuevo cliente…"
                value={newClientName} onChange={(e) => setNewClientName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateClient(); }} />
              <button className="btn-primary" onClick={handleCreateClient}>Crear</button>
              <button className="btn-ghost" onClick={() => setCreatingClient(false)}>Cancelar</button>
            </div>
          )}

          {creatingReport && (
            <div className="flex items-center gap-2 mb-3">
              <input className="input flex-1 max-w-xs" autoFocus placeholder="Nombre del nuevo informe…"
                value={newReportName} onChange={(e) => setNewReportName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleCreateReport(); }} />
              <button className="btn-primary" onClick={handleCreateReport}>Crear</button>
              <button className="btn-ghost" onClick={() => setCreatingReport(false)}>Cancelar</button>
            </div>
          )}

          <div className="text-sm text-hive-muted mb-4">
            ❤️ {detail.summary.total_likes} likes · 🔁 {detail.summary.total_shares} compartidos ·
            {" "}💬 {detail.summary.total_comments} comentarios · ➕ {detail.summary.total_follows} follows
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

          <TaskPersonaRows rows={filteredRows} onToggle={handleToggle} onToggleAll={handleToggleAll}
            onViewDetails={setViewAccountId} />
        </div>
      )}

      {viewAccountId && (
        <AccountModal accountId={viewAccountId} onClose={() => setViewAccountId(null)} />
      )}

      {managingCatalogs && (
        <CatalogManagerModal
          clients={clients}
          reports={reports}
          onRenameClient={handleRenameClient}
          onDeleteClient={handleDeleteClient}
          onRenameReport={handleRenameReport}
          onDeleteReport={handleDeleteReport}
          onClose={() => setManagingCatalogs(false)}
        />
      )}
    </div>
  );
}
