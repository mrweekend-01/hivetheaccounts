import TaskActionGroup from "./TaskActionGroup";

function rowCompletion(row) {
  const activePlatforms = row.platforms.filter((p) => p.active);
  const total = activePlatforms.length * 3;
  const done = activePlatforms.reduce(
    (sum, p) => sum + (p.liked ? 1 : 0) + (p.shared ? 1 : 0) + (p.commented ? 1 : 0), 0);
  return { total, done };
}

// Lista plana de personas con sus 3 redes y sus acciones. Sin onToggle queda
// de solo lectura (usado en el detalle de historial).
export default function TaskPersonaRows({ rows, onToggle }) {
  if (rows.length === 0) {
    return <p className="text-hive-muted py-10 text-center">No hay perfiles todavía.</p>;
  }
  return (
    <div className="card divide-y divide-hive-border overflow-x-auto">
      {rows.map((row) => {
        const { total, done } = rowCompletion(row);
        const plateClass = total === 0 ? "" : done === total ? "go" : done === 0 ? "stop" : "work";
        return (
          <div key={row.account_id}
            className="flex items-center gap-3 px-3 py-2.5 hover:bg-hive-panel2/40 min-w-max">
            <div className="w-52 shrink-0 min-w-0">
              <div className="text-sm font-medium truncate">{row.profile_name || "—"}</div>
              <div className="font-mono text-xs text-hive-muted truncate">{row.corporate_email}</div>
            </div>
            <div className="flex flex-wrap gap-2 flex-1">
              {row.platforms.map((p) => (
                <TaskActionGroup key={p.platform} platform={p.platform} active={p.active}
                  liked={p.liked} shared={p.shared} commented={p.commented}
                  onToggle={onToggle
                    ? (field) => onToggle(p.social_account_id, field, p[field])
                    : undefined} />
              ))}
            </div>
            <span className={`plate ${plateClass} shrink-0`}>
              <span className="dot" />{total === 0 ? "—" : `${done}/${total}`}
            </span>
          </div>
        );
      })}
    </div>
  );
}
