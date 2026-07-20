import TaskActionGroup from "./TaskActionGroup";

function rowCompletion(row) {
  const activePlatforms = row.platforms.filter((p) => p.active);
  const total = activePlatforms.length * 4;
  const done = activePlatforms.reduce(
    (sum, p) => sum + (p.liked ? 1 : 0) + (p.shared ? 1 : 0) + (p.commented ? 1 : 0) + (p.followed ? 1 : 0), 0);
  return { total, done };
}

// Lista plana de personas con sus 3 redes y sus acciones. Sin onToggle queda
// de solo lectura (usado en el detalle de historial).
export default function TaskPersonaRows({ rows, onToggle, onToggleAll }) {
  if (rows.length === 0) {
    return <p className="text-hive-muted py-10 text-center">No hay perfiles todavía.</p>;
  }
  return (
    <div className="card divide-y divide-hive-border overflow-x-auto">
      {rows.map((row) => {
        const { total, done } = rowCompletion(row);
        const plateClass = total === 0 ? "" : done === total ? "go" : done === 0 ? "stop" : "work";
        const allDone = total > 0 && done === total;
        return (
          <div key={row.account_id}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-hive-panel2/40 min-w-max">
            <div className="w-52 shrink-0 min-w-0">
              <div className="text-sm font-medium truncate">{row.profile_name || "—"}</div>
              <div className="font-mono text-xs text-hive-muted truncate">
                {row.device_label || "Sin celular asignado"}
              </div>
            </div>
            <div className="flex flex-wrap gap-2 flex-1">
              {row.platforms.map((p) => (
                <TaskActionGroup key={p.platform} platform={p.platform} active={p.active}
                  liked={p.liked} shared={p.shared} commented={p.commented} followed={p.followed}
                  onToggle={onToggle
                    ? (field) => onToggle(p.social_account_id, field, p[field])
                    : undefined} />
              ))}
            </div>
            {onToggleAll && (
              <button type="button" className="btn-ghost text-xs px-2 py-1.5 shrink-0"
                disabled={total === 0} title={total === 0 ? "Sin redes activas" : undefined}
                onClick={() => onToggleAll(row.account_id)}>
                {allDone ? "Desmarcar todo" : "Marcar todo"}
              </button>
            )}
            <span className={`plate ${plateClass} shrink-0`}>
              <span className="dot" />{total === 0 ? "—" : `${done}/${total}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
