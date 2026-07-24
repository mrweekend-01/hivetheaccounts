import { useState } from "react";

function CatalogSection({ title, items, onRename, onDelete }) {
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState("");

  function startEdit(item) {
    setEditingId(item.id);
    setDraft(item.name);
  }

  async function saveEdit(item) {
    const name = draft.trim();
    setEditingId(null);
    if (!name || name === item.name) return;
    await onRename(item, name);
  }

  return (
    <div>
      <h4 className="text-xs font-semibold text-hive-accent uppercase mb-2">{title}</h4>
      <div className="space-y-1.5">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            {editingId === item.id ? (
              <>
                <input className="input flex-1 text-sm" autoFocus value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={() => saveEdit(item)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") e.target.blur();
                    if (e.key === "Escape") setEditingId(null);
                  }} />
              </>
            ) : (
              <>
                <span className="flex-1 text-sm text-hive-text truncate">{item.name}</span>
                <button type="button" className="btn-ghost text-xs px-2 py-1"
                  title="Renombrar" onClick={() => startEdit(item)}>✏️</button>
                <button type="button" className="btn-ghost text-xs px-2 py-1 text-bad hover:bg-bad/10"
                  title="Eliminar" onClick={() => onDelete(item)}>🗑</button>
              </>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-hive-muted text-xs py-2">Nada creado todavía.</p>
        )}
      </div>
    </div>
  );
}

export default function CatalogManagerModal({
  clients, reports, onRenameClient, onDeleteClient, onRenameReport, onDeleteReport, onClose,
}) {
  return (
    <div className="fixed inset-0 bg-black/70 grid place-items-center z-50 p-4" onClick={onClose}>
      <div className="card w-full max-w-md max-h-[80vh] overflow-y-auto p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Gestionar catálogos</h3>
          <button className="text-hive-muted hover:text-hive-text text-xl leading-none" onClick={onClose}>×</button>
        </div>
        <div className="space-y-5">
          <CatalogSection title="Clientes" items={clients}
            onRename={onRenameClient} onDelete={onDeleteClient} />
          <CatalogSection title="Informes" items={reports}
            onRename={onRenameReport} onDelete={onDeleteReport} />
        </div>
      </div>
    </div>
  );
}
