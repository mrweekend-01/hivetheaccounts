import { useEffect, useState } from "react";
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, useSensor, useSensors, useDroppable,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import api from "../api/client";

const STATUS_ORDER = ["no_arrancada", "en_proceso", "finalizada"];
const STATUS_LABEL = { no_arrancada: "No arrancada", en_proceso: "En proceso", finalizada: "Finalizada" };
const PRIORITY_LABEL = { baja: "Baja", media: "Media", alta: "Alta" };
const PRIORITY_CHIP = {
  baja: "bg-hive-panel2 text-hive-muted",
  media: "bg-warn/15 text-warn",
  alta: "bg-bad/15 text-bad",
};
const emptyForm = { title: "", description: "", priority: "media", assigned_to: "" };

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}`;
}

function UrgentCard({ task, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });
  const style = { transform: CSS.Transform.toString(transform), transition };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={`kanban-card priority-${task.priority} ${isDragging ? "dragging" : ""}`}
      onClick={() => onOpen(task)}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <h4 className="text-sm font-medium leading-snug">{task.title}</h4>
        <span className={`chip shrink-0 ${PRIORITY_CHIP[task.priority]}`}>{PRIORITY_LABEL[task.priority]}</span>
      </div>
      {task.description && (
        <p className="text-xs text-hive-muted mb-2 line-clamp-2">{task.description}</p>
      )}
      <div className="flex items-center justify-between text-xs text-hive-muted">
        <span className="truncate">{task.assignee_name || "Sin asignar"}</span>
        <span className="font-mono shrink-0 ml-2">{fmtDate(task.created_at)}</span>
      </div>
    </div>
  );
}

function KanbanColumn({ status, tasks, onOpenCard }) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div className="kanban-col">
      <div className={`kanban-col-head ${status}`}>
        <span className="font-mono text-xs font-bold uppercase tracking-wide text-hive-text">
          {STATUS_LABEL[status]}
        </span>
        <span className="chip bg-hive-panel2 text-hive-muted">{tasks.length}</span>
      </div>
      <div ref={setNodeRef} className={`kanban-col-body ${isOver ? "over" : ""}`}>
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((t) => <UrgentCard key={t.id} task={t} onOpen={onOpenCard} />)}
        </SortableContext>
        {tasks.length === 0 && (
          <p className="text-xs text-hive-muted text-center py-6">Sin tareas</p>
        )}
      </div>
    </div>
  );
}

export default function UrgentTasks() {
  const [tasks, setTasks] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [form, setForm] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  function load() {
    api.get("/urgent-tasks").then((r) => setTasks(r.data));
  }
  useEffect(load, []);
  useEffect(() => {
    api.get("/users").then((r) => setAdmins(r.data.filter((u) => u.role === "admin")));
  }, []);

  function handleDragStart(event) {
    setActiveId(event.active.id);
  }

  function handleDragEnd(event) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;
    const targetStatus = STATUS_ORDER.includes(over.id)
      ? over.id
      : tasks.find((t) => t.id === over.id)?.status;
    if (!targetStatus || targetStatus === task.status) return;

    const prevTasks = tasks;
    const nowIso = new Date().toISOString();
    setTasks((prev) => prev.map((t) => {
      if (t.id !== task.id) return t;
      const finished_at = targetStatus === "finalizada"
        ? (t.finished_at || nowIso)
        : (t.status === "finalizada" ? null : t.finished_at);
      return { ...t, status: targetStatus, finished_at };
    }));

    api.patch(`/urgent-tasks/${task.id}/status`, { status: targetStatus })
      .catch(() => setTasks(prevTasks));
  }

  function openCreate() {
    setErr("");
    setForm({ ...emptyForm });
  }

  function openEdit(task) {
    setErr("");
    setForm({
      id: task.id, title: task.title, description: task.description || "",
      priority: task.priority, assigned_to: task.assigned_to ? String(task.assigned_to) : "",
    });
  }

  async function saveTask() {
    setErr("");
    if (!form.title.trim()) { setErr("El título es obligatorio."); return; }
    setBusy(true);
    const body = {
      title: form.title, description: form.description || null,
      priority: form.priority, assigned_to: form.assigned_to ? Number(form.assigned_to) : null,
    };
    try {
      if (form.id) await api.put(`/urgent-tasks/${form.id}`, body);
      else await api.post("/urgent-tasks", body);
      setForm(null);
      load();
    } catch (e) {
      setErr(e.response?.data?.detail || "Error al guardar");
    } finally {
      setBusy(false);
    }
  }

  async function deleteTask() {
    if (!confirm("¿Eliminar esta tarea urgente?")) return;
    await api.delete(`/urgent-tasks/${form.id}`);
    setForm(null);
    load();
  }

  const activeTask = tasks.find((t) => t.id === activeId);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="page-title">Urgent Task</h1>
        <button className="btn-primary" onClick={openCreate}>+ Nueva tarea urgente</button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCorners}
        onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 md:grid-cols-3">
          {STATUS_ORDER.map((status) => (
            <KanbanColumn key={status} status={status}
              tasks={tasks.filter((t) => t.status === status)}
              onOpenCard={openEdit} />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? (
            <div className={`kanban-card priority-${activeTask.priority} shadow-lg rotate-2`}>
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <h4 className="text-sm font-medium leading-snug">{activeTask.title}</h4>
                <span className={`chip shrink-0 ${PRIORITY_CHIP[activeTask.priority]}`}>
                  {PRIORITY_LABEL[activeTask.priority]}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-hive-muted">
                <span className="truncate">{activeTask.assignee_name || "Sin asignar"}</span>
                <span className="font-mono shrink-0 ml-2">{fmtDate(activeTask.created_at)}</span>
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {form && (
        <div className="fixed inset-0 bg-black/70 grid place-items-center z-50 p-4" onClick={() => setForm(null)}>
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">{form.id ? "Editar tarea urgente" : "Nueva tarea urgente"}</h3>

            <label className="label">Título</label>
            <input className="input mb-3" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} />

            <label className="label">Descripción</label>
            <textarea className="input mb-3" rows={3} value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })} />

            <label className="label">Prioridad</label>
            <select className="input mb-3" value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}>
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>

            <label className="label">Asignar a</label>
            <select className="input mb-3" value={form.assigned_to}
              onChange={(e) => setForm({ ...form, assigned_to: e.target.value })}>
              <option value="">— sin asignar —</option>
              {admins.map((a) => (
                <option key={a.id} value={a.id}>{a.full_name || a.username}</option>
              ))}
            </select>

            {err && <p className="text-bad text-sm mb-3">{err}</p>}
            <div className="flex justify-between gap-2 mt-5">
              {form.id
                ? <button className="btn-danger" onClick={deleteTask}>Eliminar</button>
                : <span />}
              <div className="flex gap-2">
                <button className="btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
                <button className="btn-primary" onClick={saveTask} disabled={busy}>
                  {busy ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
