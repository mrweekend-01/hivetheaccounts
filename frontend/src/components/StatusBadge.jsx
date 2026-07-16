const MAP = {
  activo:      { c: "go", t: "Activo" },
  inactivo:    { c: "", t: "Inactivo" },
  suspendido:  { c: "stop", t: "Suspendido" },
  en_revision: { c: "work", t: "En revisión" },
  operativo:   { c: "go", t: "Operativo" },
  inoperativo: { c: "stop", t: "Inoperativo" },
  pendiente:   { c: "", t: "Pendiente" },
  en_proceso:  { c: "work", t: "En proceso" },
  hecho:       { c: "go", t: "Hecho" },
};

export default function StatusBadge({ status }) {
  const s = MAP[status] || { c: "", t: status };
  return (
    <span className={`plate ${s.c}`}>
      <span className="dot" />
      {s.t}
    </span>
  );
}
