const MAP = {
  activo:      { c: "bg-ok/15 text-ok", t: "Activo" },
  inactivo:    { c: "bg-hive-panel2 text-hive-muted", t: "Inactivo" },
  suspendido:  { c: "bg-bad/15 text-bad", t: "Suspendido" },
  en_revision: { c: "bg-warn/15 text-warn", t: "En revisión" },
  operativo:   { c: "bg-ok/15 text-ok", t: "Operativo" },
  inoperativo: { c: "bg-bad/15 text-bad", t: "Inoperativo" },
  pendiente:   { c: "bg-hive-panel2 text-hive-muted", t: "Pendiente" },
  en_proceso:  { c: "bg-warn/15 text-warn", t: "En proceso" },
  hecho:       { c: "bg-ok/15 text-ok", t: "Hecho" },
};

export default function StatusBadge({ status }) {
  const s = MAP[status] || { c: "bg-hive-panel2 text-hive-muted", t: status };
  return <span className={`chip ${s.c}`}>{s.t}</span>;
}
